export interface SocialHandlers {
    name: string;
    url: string;
}

export interface MadeBy {
    name: string;
    url: string;
}

export interface InfoData {
    name: string;
    email: string;
    mobile: string;
    alternateMobile: string;
    address: string;
    location: string;
    mapEmbed: string;
    workinghours: string;
    social: SocialHandlers[];
    madeBy: MadeBy;
}


export const INFO_DATA: InfoData = {
    name: "SSB REAL ESTATES",
    email: "hello@ssb.com",
    mobile: "812 3456 7890",
    alternateMobile: "9820114463",
    address: "Dubai-based architecture and interior design studio",
    location: "https://maps.app.goo.gl/HbocCQDvcFayRu587",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1885.2217740721733!2d72.83695379999999!3d19.08818805!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9a436fe8d7b%3A0x408a0480fc9ac581!2sKhira%20Nagar%2C%20Santacruz%20(West)%2C%20Mumbai%2C%20Maharashtra%20400054!5e0!3m2!1sen!2sin!4v1787296632357!5m2!1sen!2sin",
    workinghours: "All Week 9:00 AM - 6:00 PM (IST)",
    social: [
        {
            name: "Instagram",
            url: "https://www.instagram.com",
        },
        {
            name: "Facebook",
            url: "https://www.facebook.com",
        },
        // {
        //     name: "Twitter",
        //     url: "https://twitter.com",
        // },
        // {
        //     name: "LinkedIn",
        //     url: "https://linkedin.com",
        // },
    ],
    madeBy: {
        name: "Buzzlink Studios",
        url: "https://buzzlinkstudios.com",
    },
};
