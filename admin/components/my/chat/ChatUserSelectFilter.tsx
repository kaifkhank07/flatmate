"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchUsers, UserItem } from "@/lib/api";
import { Avatar, Card } from "@/components/ui";

import ResetFilterButton from "@/components/my/ui/ResetFilterButton";
import { Info, RotateCw, Search, X } from "lucide-react";

function getUserName(user?: UserItem | null) {
  if (!user) return "Select user";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || user.mobile || "User";
}

function getUserAvatarSrc(user?: UserItem | null): string | undefined {
  if (!user || !user.image) return undefined;
  if (typeof user.image === "string") return user.image;
  if (typeof user.image === "object" && "url" in user.image && user.image.url) {
    return user.image.url;
  }
  return undefined;
}

interface UserSelectDropdownProps {
  label: string;
  selectedUser: UserItem | null;
  onSelectUser: (user: UserItem | null) => void;
  excludeUserId?: string | null;
  placeholder?: string;
}

function UserSelectDropdown({
  label,
  selectedUser,
  onSelectUser,
  excludeUserId,
  placeholder = "Search or select user...",
}: UserSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch users API with query
  const loadUsers = useCallback(async (query: string) => {
    setLoading(true);
    const res = await fetchUsers({ limit: 20, search: query });
    if (res.success && res.data) {
      setUsers(res.data.users || []);
    } else {
      setUsers([]);
    }
    setLoading(false);
  }, []);

  // Debounced search when isOpen & searchTerm changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadUsers(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, loadUsers]);

  const filteredUsers = users.filter((u) => u._id !== excludeUserId);

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {selectedUser ? (
        <div className="h-[44px] flex items-center justify-between px-3 rounded-xl bg-[var(--card-2)] border border-[var(--hair-2)] text-[var(--ink)] shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={getUserName(selectedUser)} src={getUserAvatarSrc(selectedUser)} size={26} />
            <div className="min-w-0 text-xs leading-tight">
              <div className="font-semibold text-[var(--ink)] truncate">{getUserName(selectedUser)}</div>
              {selectedUser.email && (
                <div className="text-[10px] text-[var(--ink-3)] truncate mt-0.5">{selectedUser.email}</div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectUser(null);
              setSearchTerm("");
              setIsOpen(false);
            }}
            className="p-1 text-[var(--ink-3)] hover:text-[var(--ember)] rounded-lg hover:bg-[var(--canvas-2)] transition-colors ml-2 flex-shrink-0"
            title="Clear user"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[var(--ink-4)] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onFocus={() => {
                setIsOpen(true);
                loadUsers(searchTerm);
              }}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              placeholder={placeholder}
              className="h-[44px] w-full bg-[var(--card-2)] border border-[var(--hair)] hover:border-[var(--ember)] focus:border-[var(--ember)] focus:outline-none rounded-xl pl-9 pr-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-4)] transition-colors shadow-sm"
            />
          </div>

          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 p-2 bg-[var(--card)] border border-[var(--hair-2)] rounded-xl shadow-2xl space-y-1 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="py-4 text-center text-xs text-[var(--ink-3)] flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin text-[var(--ember)]">
                    <RotateCw size={13} />
                  </span>
                  <span>Searching users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-4 text-center text-xs text-[var(--ink-3)] font-medium">No matching users found</div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectUser(user);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-[var(--ember-soft)] hover:text-[var(--ember-ink)] text-xs text-[var(--ink)] transition-colors"
                    >
                      <Avatar name={getUserName(user)} src={getUserAvatarSrc(user)} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{getUserName(user)}</div>
                        {user.email && <div className="text-[10px] text-[var(--ink-3)] truncate">{user.email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface ChatUserSelectFilterProps {
  search: string;
  user1: UserItem | null;
  user2: UserItem | null;
  onSearchChange: (value: string) => void;
  onUser1Change: (user: UserItem | null) => void;
  onUser2Change: (user: UserItem | null) => void;
  onReset: () => void;
}

export default function ChatUserSelectFilter({
  search,
  user1,
  user2,
  onSearchChange,
  onUser1Change,
  onUser2Change,
  onReset,
}: ChatUserSelectFilterProps) {
  const isFiltered = Boolean(search || user1 || user2);

  return (
    <Card className="p-4 space-y-3 relative z-30">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        {/* Search Conversations */}
        <div className="flex-1 w-full min-w-[220px]">
          <label className="block text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider mb-1.5">
            Search Conversations
          </label>
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[var(--ink-4)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by participant name or email..."
              className="h-[44px] w-full bg-[var(--card-2)] border border-[var(--hair)] hover:border-[var(--ember)] focus:border-[var(--ember)] focus:outline-none rounded-xl pl-9 pr-8 text-xs text-[var(--ink)] placeholder:text-[var(--ink-4)] transition-colors shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 text-[var(--ink-4)] hover:text-[var(--ember)] transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User 1 Selector */}
        <UserSelectDropdown
          label="User 1"
          selectedUser={user1}
          onSelectUser={onUser1Change}
          excludeUserId={user2?._id}
          placeholder="Search or select user..."
        />

        {/* User 2 Selector */}
        <UserSelectDropdown
          label="User 2"
          selectedUser={user2}
          onSelectUser={onUser2Change}
          excludeUserId={user1?._id}
          placeholder="Search or select user..."
        />

        {/* Reset Filter Button */}
        {isFiltered && (
          <div className="flex items-center self-end h-[44px]">
            <ResetFilterButton onClick={onReset} visible={isFiltered} />
          </div>
        )}
      </div>

      {/* Helper notice when both users are selected */}
      {user1 && user2 && (
        <div className="text-[11.5px] font-medium text-[var(--ember-ink)] bg-[var(--ember-soft)] border border-[var(--ember-2)] rounded-xl px-3.5 py-2 flex items-center gap-2">
          <Info size={14} />
          <span>
            Showing exact conversation between <strong>{getUserName(user1)}</strong> and <strong>{getUserName(user2)}</strong>
          </span>
        </div>
      )}
    </Card>
  );
}
