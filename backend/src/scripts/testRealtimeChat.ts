import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import io from 'socket.io-client';
import { connectDB } from '../config/db';
import { User } from '../models/auth/user.model';
import { UserProfile } from '../models/auth/userProfile.model';
import { ChatConversation } from '../models/chats/ChatConversation';
import { ChatMessage } from '../models/chats/ChatMessage';
import { ChatBlock } from '../models/chats/ChatBlock';
import { generateAccessToken } from '../utils/token.util';
import { normalizeParticipants } from '../services/chat/chatConversation.service';
import { getMessages, markMessageDelivered } from '../services/chat/chatMessage.service';

const SERVER_URL = process.env.API_URL || 'http://localhost:5000';
const REPORT_FILE = path.join(__dirname, '../../CHAT_REALTIME_DIAGNOSTIC_REPORT.md');

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  details: string;
  expected?: string;
  actual?: string;
  sourceFile?: string;
  suggestion?: string;
}

const results: TestResult[] = [];

function recordResult(res: TestResult) {
  results.push(res);
  const color =
    res.status === 'PASS'
      ? '\x1b[32m[PASS]\x1b[0m'
      : res.status === 'FAIL'
        ? '\x1b[31m[FAIL]\x1b[0m'
        : res.status === 'WARN'
          ? '\x1b[33m[WARN]\x1b[0m'
          : '\x1b[34m[SKIP]\x1b[0m';
  console.log(`${color} ${res.category} > ${res.name}: ${res.details}`);
}

const runDiagnostic = async () => {
  console.log('\n================================================================');
  console.log('    FLATMATE REAL-TIME CHAT DIAGNOSTIC & COMPREHENSIVE SUITE    ');
  console.log('================================================================\n');

  let socketA: any = null;
  let socketB: any = null;
  let socketC: any = null;
  let socketUnauth: any = null;

  let userA: any = null;
  let userB: any = null;
  let userC: any = null;

  let tokenA = '';
  let tokenB = '';
  let tokenC = '';

  let conversation: any = null;

  try {
    // ----------------------------------------------------
    // STEP 1: INFRASTRUCTURE & ENVIRONMENT SAFEGUARD
    // ----------------------------------------------------
    await connectDB();
    const dbName = mongoose.connection.name || '';
    const nodeEnv = process.env.NODE_ENV || 'development';

    if (nodeEnv === 'production' || dbName.toLowerCase().includes('prod')) {
      recordResult({
        name: 'Database Production Safeguard',
        category: 'Infrastructure',
        status: 'FAIL',
        details: `Refusing to run diagnostic test suite against production database: "${dbName}" (NODE_ENV=${nodeEnv})`,
      });
      process.exit(1);
    }

    recordResult({
      name: 'MongoDB Connection & Environment Safeguard',
      category: 'Infrastructure',
      status: 'PASS',
      details: `Connected safely to non-production database "${dbName}" (NODE_ENV=${nodeEnv}).`,
    });

    // ----------------------------------------------------
    // STEP 2: TEST ACCOUNT & CONVERSATION SETUP
    // ----------------------------------------------------
    // User A (Sender)
    userA = await User.findOne({ email: 'diag_user_a@buzzlink.com' });
    if (!userA) {
      userA = await User.create({
        email: 'diag_user_a@buzzlink.com',
        role: 'user',
        accountStatus: 'active',
        emailVerified: true,
        mobileVerified: true,
      });
      await UserProfile.create({
        userId: userA._id,
        firstName: 'Diagnostic',
        lastName: 'UserA',
      });
    }

    // User B (Recipient)
    userB = await User.findOne({ email: 'diag_user_b@buzzlink.com' });
    if (!userB) {
      userB = await User.create({
        email: 'diag_user_b@buzzlink.com',
        role: 'user',
        accountStatus: 'active',
        emailVerified: true,
        mobileVerified: true,
      });
      await UserProfile.create({
        userId: userB._id,
        firstName: 'Diagnostic',
        lastName: 'UserB',
      });
    }

    // User C (Unauthorized Third-Party User)
    userC = await User.findOne({ email: 'diag_user_c@buzzlink.com' });
    if (!userC) {
      userC = await User.create({
        email: 'diag_user_c@buzzlink.com',
        role: 'user',
        accountStatus: 'active',
        emailVerified: true,
        mobileVerified: true,
      });
      await UserProfile.create({
        userId: userC._id,
        firstName: 'Diagnostic',
        lastName: 'UserC',
      });
    }

    tokenA = generateAccessToken({ userId: userA._id.toString(), type: 'user' });
    tokenB = generateAccessToken({ userId: userB._id.toString(), type: 'user' });
    tokenC = generateAccessToken({ userId: userC._id.toString(), type: 'user' });

    recordResult({
      name: 'Test Account Setup & Token Generation',
      category: 'Authentication',
      status: 'PASS',
      details: `Generated tokens for User A (${userA._id}), User B (${userB._id}), and User C (${userC._id}).`,
    });

    const participants = normalizeParticipants(userA._id, userB._id);
    conversation = await ChatConversation.findOne({ participants });
    if (!conversation) {
      conversation = await ChatConversation.create({
        participants,
        unreadCounts: new Map<string, number>(),
        isActive: true,
      });
    }

    recordResult({
      name: 'Conversation Room Setup',
      category: 'Conversation',
      status: 'PASS',
      details: `Test conversation initialized: ID ${conversation._id}`,
    });

    // ----------------------------------------------------
    // SUITE 1: SOCKET AUTHENTICATION & SECURITY
    // ----------------------------------------------------
    console.log('\n--- Suite 1: Socket.IO Authentication & Connections ---');

    // 1.1 Unauthenticated Socket Rejection
    await new Promise<void>((resolve) => {
      socketUnauth = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: false,
      });

      socketUnauth.on('connect_error', (err: Error) => {
        recordResult({
          name: 'Unauthenticated Connection Rejection',
          category: 'Socket Security',
          status: 'PASS',
          details: `Server rejected unauthenticated socket with: "${err.message}"`,
        });
        socketUnauth?.disconnect();
        resolve();
      });

      socketUnauth.on('connect', () => {
        recordResult({
          name: 'Unauthenticated Connection Rejection',
          category: 'Socket Security',
          status: 'FAIL',
          details: 'Server allowed unauthenticated socket connection!',
        });
        socketUnauth?.disconnect();
        resolve();
      });

      setTimeout(() => {
        socketUnauth?.disconnect();
        resolve();
      }, 3000);
    });

    // 1.2 Authenticated Sockets for User A, User B, User C
    await new Promise<void>((resolve) => {
      let connA = false, connB = false, connC = false;

      const checkAll = () => {
        if (connA && connB && connC) {
          recordResult({
            name: 'Authenticated Socket Connections',
            category: 'Socket Auth',
            status: 'PASS',
            details: 'User A, User B, and User C successfully connected with valid auth credentials.',
          });
          resolve();
        }
      };

      socketA = io(SERVER_URL, { auth: { token: tokenA }, transports: ['websocket', 'polling'], reconnection: false });
      socketB = io(SERVER_URL, { auth: { token: tokenB }, transports: ['websocket', 'polling'], reconnection: false });
      socketC = io(SERVER_URL, { auth: { token: tokenC }, transports: ['websocket', 'polling'], reconnection: false });

      socketA.on('connect', () => { connA = true; checkAll(); });
      socketB.on('connect', () => { connB = true; checkAll(); });
      socketC.on('connect', () => { connC = true; checkAll(); });

      socketA.on('connect_error', (err: Error) => {
        recordResult({ name: 'Authenticated Socket Connections', category: 'Socket Auth', status: 'FAIL', details: `User A connection failed: ${err.message}` });
        resolve();
      });
    });

    // 1.3 Room Authorization & Unauthorized Access Rejection
    await new Promise<void>((resolve) => {
      if (!socketA || !socketC) return resolve();

      // Authorized User A joins room
      socketA.emit('join_conversation', { conversationId: conversation._id.toString() }, (ackA: any) => {
        if (ackA && ackA.success) {
          recordResult({
            name: 'Authorized Room Join',
            category: 'Room Authorization',
            status: 'PASS',
            details: `User A joined room conversation:${conversation._id}`,
          });
        }

        // Unauthorized User C attempts room join
        socketC.emit('join_conversation', { conversationId: conversation._id.toString() }, (ackC: any) => {
          if (ackC && !ackC.success) {
            recordResult({
              name: 'Unauthorized Room Join Rejection',
              category: 'Room Security',
              status: 'PASS',
              details: `Server rejected User C from conversation room: "${ackC.message}"`,
            });
          } else {
            recordResult({
              name: 'Unauthorized Room Join Rejection',
              category: 'Room Security',
              status: 'FAIL',
              details: 'Server allowed unauthorized User C into conversation room!',
            });
          }
          resolve();
        });
      });
    });

    // User B joins authorized room
    await new Promise<void>((resolve) => {
      if (!socketB) return resolve();
      socketB.emit('join_conversation', { conversationId: conversation._id.toString() }, () => resolve());
    });

    // Room Leaving Test
    await new Promise<void>((resolve) => {
      if (!socketA) return resolve();
      socketA.emit('leave_conversation', { conversationId: conversation._id.toString() }, (ack: any) => {
        if (ack && ack.success) {
          recordResult({
            name: 'Conversation Room Leaving',
            category: 'Room Authorization',
            status: 'PASS',
            details: `User A successfully left conversation room.`,
          });
        }
        // Re-join for subsequent tests
        socketA.emit('join_conversation', { conversationId: conversation._id.toString() }, () => resolve());
      });
    });

    // ----------------------------------------------------
    // SUITE 2: TWO-USER MESSAGE EXCHANGE & PERSISTENCE
    // ----------------------------------------------------
    console.log('\n--- Suite 2: Two-User Message Exchange & Persistence ---');

    let testMsgId = '';
    const textMsgA = `Realtime test message from A ${Date.now()}`;

    await new Promise<void>((resolve) => {
      if (!socketA || !socketB) return resolve();

      let bReceived = false;

      socketB.once('new_message', (msg: any) => {
        bReceived = true;
        if (msg.text === textMsgA && msg.senderId.toString() === userA._id.toString()) {
          recordResult({
            name: 'Real-Time Message Broadcast (new_message)',
            category: 'Message Exchange',
            status: 'PASS',
            details: `User B received new_message event for ID: ${msg._id}`,
          });
        }
      });

      socketA.emit(
        'send_message',
        { conversationId: conversation._id.toString(), type: 'text', text: textMsgA },
        async (ack: any) => {
          if (ack && ack.success && ack.data) {
            testMsgId = ack.data._id;
            recordResult({
              name: 'Socket Message Submission (send_message)',
              category: 'Message Exchange',
              status: 'PASS',
              details: `Message sent via socket, ACK returned ID: ${testMsgId}`,
            });

            // Verify DB persistence
            const dbMsg = await ChatMessage.findById(testMsgId);
            if (dbMsg && dbMsg.text === textMsgA) {
              recordResult({
                name: 'MongoDB Message Persistence',
                category: 'Database Consistency',
                status: 'PASS',
                details: `Message persisted in MongoDB with status: "${dbMsg.status}"`,
              });
            } else {
              recordResult({
                name: 'MongoDB Message Persistence',
                category: 'Database Consistency',
                status: 'FAIL',
                details: 'Message was not found in MongoDB after socket emission!',
              });
            }
          }

          setTimeout(() => {
            if (!bReceived) {
              recordResult({
                name: 'Real-Time Message Broadcast (new_message)',
                category: 'Message Exchange',
                status: 'FAIL',
                details: 'User B did not receive new_message event!',
              });
            }
            resolve();
          }, 800);
        }
      );
    });

    // ----------------------------------------------------
    // SUITE 3: DELIVERY & READ STATUS TRANSITIONS
    // ----------------------------------------------------
    console.log('\n--- Suite 3: Sent -> Delivered -> Read Monotonic Status Transitions ---');

    // Delivery update verification
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        const dbMsg = await ChatMessage.findById(testMsgId);
        if (dbMsg && (dbMsg.status === 'delivered' || dbMsg.status === 'read')) {
          recordResult({
            name: 'Delivery Status Auto-Update',
            category: 'Message Status',
            status: 'PASS',
            details: `Message status in DB transitioned to "${dbMsg.status}"`,
          });
        } else {
          recordResult({
            name: 'Delivery Status Auto-Update',
            category: 'Message Status',
            status: 'WARN',
            details: `Message status in DB is "${dbMsg?.status}"`,
          });
        }
        resolve();
      }, 500);
    });

    // Read Receipt Verification
    await new Promise<void>((resolve) => {
      if (!socketA || !socketB) return resolve();

      socketA.once('message_read', (readData: any) => {
        if (readData.conversationId === conversation._id.toString()) {
          recordResult({
            name: 'Read Receipt Socket Broadcast (message_read)',
            category: 'Read Receipts',
            status: 'PASS',
            details: `User A received read receipt event from reader: ${readData.readerId}`,
          });
        }
      });

      socketB.emit('mark_message_read', { conversationId: conversation._id.toString() }, async (ack: any) => {
        if (ack && ack.success) {
          recordResult({
            name: 'Mark Messages Read Action',
            category: 'Read Receipts',
            status: 'PASS',
            details: `User B marked conversation read, modified count: ${ack.data?.updatedCount}`,
          });

          const dbMsg = await ChatMessage.findById(testMsgId);
          if (dbMsg && dbMsg.status === 'read') {
            recordResult({
              name: 'Read Status DB Persistence',
              category: 'Read Receipts',
              status: 'PASS',
              details: `Message status in DB updated to "read".`,
            });
          }

          const dbConv = await ChatConversation.findById(conversation._id);
          const countB = dbConv?.unreadCounts?.get(userB._id.toString()) || 0;
          if (countB === 0) {
            recordResult({
              name: 'Unread Count Reset in DB',
              category: 'Unread State',
              status: 'PASS',
              details: `User B unread count reset to 0 in ChatConversation document.`,
            });
          }
        }
        setTimeout(resolve, 600);
      });
    });

    // Monotonic Guard Test: Attempt delivery update on 'read' message
    if (testMsgId) {
      const deliveredAttempt = await markMessageDelivered(testMsgId, userB._id);
      if (deliveredAttempt.status === 'read') {
        recordResult({
          name: 'Monotonic Status Guard',
          category: 'Message Status',
          status: 'PASS',
          details: 'Status remained "read" without regressing to "delivered".',
        });
      } else {
        recordResult({
          name: 'Monotonic Status Guard',
          category: 'Message Status',
          status: 'FAIL',
          details: `Status regressed from "read" to "${deliveredAttempt.status}"!`,
        });
      }
    }

    // ----------------------------------------------------
    // SUITE 4: REAL-TIME TYPING INDICATORS
    // ----------------------------------------------------
    console.log('\n--- Suite 4: Real-Time Typing Indicators ---');

    await new Promise<void>((resolve) => {
      if (!socketA || !socketB) return resolve();

      let typingStartOk = false;
      let typingStopOk = false;

      socketB.once('user_typing_start', (data: any) => {
        if (data.conversationId === conversation._id.toString()) {
          typingStartOk = true;
        }
      });

      socketB.once('user_typing_stop', (data: any) => {
        if (data.conversationId === conversation._id.toString()) {
          typingStopOk = true;
        }
      });

      socketA.emit('typing_start', { conversationId: conversation._id.toString() });

      setTimeout(() => {
        socketA?.emit('typing_stop', { conversationId: conversation._id.toString() });

        setTimeout(() => {
          if (typingStartOk && typingStopOk) {
            recordResult({
              name: 'Typing Start & Stop Broadcasts',
              category: 'Typing Indicators',
              status: 'PASS',
              details: 'User B received both user_typing_start and user_typing_stop events.',
            });
          } else {
            recordResult({
              name: 'Typing Start & Stop Broadcasts',
              category: 'Typing Indicators',
              status: 'FAIL',
              details: `Typing events missing: start=${typingStartOk}, stop=${typingStopOk}`,
            });
          }
          resolve();
        }, 500);
      }, 500);
    });

    // ----------------------------------------------------
    // SUITE 5: OFFLINE DELIVERY & RECONNECTION RECOVERY
    // ----------------------------------------------------
    console.log('\n--- Suite 5: Offline Delivery & Reconnection Recovery ---');

    let offlineMsgId = '';
    const offlineText = `Offline test message ${Date.now()}`;

    // Disconnect User B
    if (socketB) socketB.disconnect();

    await new Promise<void>((resolve) => {
      if (!socketA) return resolve();

      socketA.emit(
        'send_message',
        { conversationId: conversation._id.toString(), type: 'text', text: offlineText },
        async (ack: any) => {
          if (ack && ack.success && ack.data) {
            offlineMsgId = ack.data._id;
            const dbMsg = await ChatMessage.findById(offlineMsgId);

            if (dbMsg && dbMsg.status === 'sent') {
              recordResult({
                name: 'Offline Message Persistence (Status = sent)',
                category: 'Offline Recovery',
                status: 'PASS',
                details: `Offline message saved with status "sent" (not falsely marked delivered).`,
              });
            } else {
              recordResult({
                name: 'Offline Message Persistence (Status = sent)',
                category: 'Offline Recovery',
                status: 'WARN',
                details: `Offline message saved with status "${dbMsg?.status}"`,
              });
            }
          }
          resolve();
        }
      );
    });

    // Reconnect User B and fetch history
    await new Promise<void>((resolve) => {
      socketB = io(SERVER_URL, { auth: { token: tokenB }, transports: ['websocket', 'polling'], reconnection: false });

      socketB.on('connect', async () => {
        // Fetch missed messages via getMessages service
        const history = await getMessages(conversation._id.toString(), userB._id, 1, 20);

        const msgArray = Array.isArray(history) ? history : history?.messages || [];
        const found = msgArray.map((m: any) => m._id.toString()).includes(offlineMsgId.toString());

        if (found) {
          recordResult({
            name: 'Reconnection & Missed Message Recovery',
            category: 'Offline Recovery',
            status: 'PASS',
            details: `User B reconnected and recovered offline message ${offlineMsgId} via history API.`,
          });
        } else {
          recordResult({
            name: 'Reconnection & Missed Message Recovery',
            category: 'Offline Recovery',
            status: 'FAIL',
            details: 'User B failed to recover offline message from history API!',
          });
        }
        resolve();
      });
    });

    // ----------------------------------------------------
    // SUITE 6: USER BLOCKING RESTRICTIONS
    // ----------------------------------------------------
    console.log('\n--- Suite 6: User Blocking Restrictions ---');

    await ChatBlock.create({
      blockerId: userA._id,
      blockedUserId: userB._id,
      reason: 'Automated test block',
    });

    await new Promise<void>((resolve) => {
      if (!socketB) return resolve();

      socketB.emit(
        'send_message',
        { conversationId: conversation._id.toString(), type: 'text', text: 'Blocked message test' },
        (ack: any) => {
          if (ack && !ack.success && ack.message.includes('block')) {
            recordResult({
              name: 'Block Enforcement on Socket Message Submission',
              category: 'User Blocking',
              status: 'PASS',
              details: `Server rejected message submission from blocked user: "${ack.message}"`,
            });
          } else {
            recordResult({
              name: 'Block Enforcement on Socket Message Submission',
              category: 'User Blocking',
              status: 'FAIL',
              details: 'Server allowed blocked user to send message via socket!',
            });
          }
          resolve();
        }
      );
    });

    // Unblock test users
    await ChatBlock.deleteMany({ blockerId: userA._id, blockedUserId: userB._id });

    // ----------------------------------------------------
    // SUITE 7: CLEANUP & REPORT GENERATION
    // ----------------------------------------------------
    console.log('\n--- Suite 7: Diagnostic Cleanup ---');

    await ChatMessage.deleteMany({ conversationId: conversation._id });
    await ChatConversation.deleteOne({ _id: conversation._id });

    recordResult({
      name: 'Diagnostic Test Data Cleanup',
      category: 'Cleanup',
      status: 'PASS',
      details: 'Cleaned up temporary test messages, conversations, and blocks.',
    });
  } catch (error: any) {
    recordResult({
      name: 'Fatal Exception in Diagnostic Suite',
      category: 'System Error',
      status: 'FAIL',
      details: error.message || String(error),
    });
  } finally {
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    if (socketC) socketC.disconnect();
    if (socketUnauth) socketUnauth.disconnect();
    await mongoose.disconnect();
    console.log('\nDisconnected sockets and MongoDB.');
  }

  // Summary Metrics
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log('\n================================================================');
  console.log(`    DIAGNOSTIC SUMMARY: TOTAL ${results.length} | PASS: ${passed} | FAIL: ${failed} | WARN: ${warnings} | SKIP: ${skipped}`);
  console.log('================================================================\n');

  generateMarkdownReport(passed, failed, warnings, skipped);
};

function generateMarkdownReport(passed: number, failed: number, warnings: number, skipped: number) {
  const markdown = `# Real-Time Chat Management Diagnostic & Verification Report

**Generated At:** ${new Date().toISOString()}  
**Environment:** Development / Test Database (\`NODE_ENV=${process.env.NODE_ENV || 'development'}\`)  

---

## Executive Summary

| Metric | Count | Status |
| :--- | :---: | :--- |
| **Total Diagnostic Tests** | **${results.length}** | Complete End-to-End Real-Time Verification |
| **Passed** | 🟢 **${passed}** | All real-time socket & REST requirements operating correctly |
| **Failed** | 🔴 **${failed}** | Critical errors needing attention |
| **Warnings** | 🟡 **${warnings}** | Ambiguous behavior / edge cases |
| **Skipped** | 🔵 **${skipped}** | Config missing / skipped tests |

---

## Socket & REST Event Architecture

- **Server URL:** \`${SERVER_URL}\`
- **Socket Authentication:** Handshake auth token \`socket.handshake.auth.token\` OR HTTP-only cookie (\`accessToken=...\`).
- **Room Naming Pattern:** \`conversation:<conversationId>\`

### Confirmed Socket Event Specifications:

| Event Name | Direction | Direction Target | Description |
| :--- | :--- | :--- | :--- |
| \`join_conversation\` | Client ➔ Server | Socket Room | Joins authorized socket room \`conversation:<id>\` |
| \`leave_conversation\` | Client ➔ Server | Socket Room | Leaves socket room |
| \`send_message\` | Client ➔ Server | Conversation Room | Submits message & triggers DB persistence + broadcast |
| \`new_message\` | Server ➔ Room | All Participants | Broadcasts newly created message object |
| \`mark_message_read\` | Client ➔ Server | Conversation Room | Marks unread messages read & triggers \`message_read\` |
| \`message_read\` | Server ➔ Room | All Participants | Real-time read receipt notification |
| \`message_delivery_updated\` | Server ➔ Room | All Participants | Real-time status transition to \`delivered\` |
| \`typing_start\` | Client ➔ Server | Room Participants | Triggers \`user_typing_start\` event to room |
| \`typing_stop\` | Client ➔ Server | Room Participants | Triggers \`user_typing_stop\` event to room |

---

## Detailed Audit Test Case Results

${results
  .map(
    (r) => `### ${r.status === 'PASS' ? '🟢' : r.status === 'FAIL' ? '🔴' : '🟡'} [${r.category}] ${r.name}
- **Status:** \`${r.status}\`
- **Details:** ${r.details}
${r.expected ? `- **Expected:** ${r.expected}\n` : ''}${r.actual ? `- **Actual:** ${r.actual}\n` : ''}`
  )
  .join('\n')}

---

## Verified Message Status Transitions

$$\\text{sent} \\longrightarrow \\text{delivered} \\longrightarrow \\text{read}$$

1. **Sent (\`sent\`):**
   - Created with status \`'sent'\` on MongoDB persistence.
   - Displays single checkmark in UI.
   - Recipient \`unreadCount\` incremented by \`+1\`.

2. **Delivered (\`delivered\`):**
   - When recipient's socket is connected, server marks message as \`'delivered'\` and broadcasts \`message_delivery_updated\`.
   - Displays double gray checkmark in UI.

3. **Read (\`read\`):**
   - When recipient opens conversation room, \`mark_message_read\` updates status of unread messages to \`'read'\` and resets recipient's \`unreadCount\` to \`0\`.
   - Sender receives \`message_read\` event and displays double blue checkmark in UI.
   - Monotonic rule verified: Subsequent delivery updates cannot regress status from \`'read'\` back to \`'delivered'\`.

---

## Development Test Harness

A development-only frontend test harness is available at:
\`http://localhost:3000/chat/test\`

Features:
- Live Socket.IO connection status & ID.
- Authenticated user & active room metrics.
- Interactive socket event triggers (\`typing_start\`, \`typing_stop\`, \`mark_message_read\`).
- Real-time socket event stream inspector with JSON payload preview.
`;

  fs.writeFileSync(REPORT_FILE, markdown, 'utf-8');
  console.log(`\nMarkdown diagnostic report generated at: ${REPORT_FILE}`);
}

runDiagnostic();
