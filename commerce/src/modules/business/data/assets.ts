/**
 * Central registry of image assets used across the landing page.
 * Keeping paths here means components never hardcode URLs directly.
 */
export const assets = {
  hero: {
    src: "/B2Bhero.jpg",
    alt: "Quality control specialist inspecting premium fresh produce",
  },
  about: {
    src: "/elvarCompany.jpg",
    alt: "Interior of an AI-monitored vertical farming facility in Dubai",
  },
  products: {
    vegetables: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJMzlCxeRzpKbuRSQ641tGIlIUtUPCavGuY5OCmJlqDzCjaK5CcYTjcEZzcgT5093W0-R19Xe0ZRlm7BGSdKWeEuG3A253J0XPnvRxCMENhJ41VfdawzM0VRnwO7YXxH_tTuF4Zyo9fmsLKrf5qY5ItjswbYLXCzWlaIpQMS_gw4Nqip9cbtxdYDkDheGkFIELXIEGRQILV51qs-tYB8l9jIXpWz8OT0jnwr8ldcfK7wyHCbWzb-rjf3Llvbj9ow9Wz7_-1xVjLi0",
      alt: "Crate of premium potatoes, tomatoes, and peppers",
    },
    fruits: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbYqFU46Ykm4JYwbvVTwcAU_muQtpYmdNOaNyNyxzYKuvaGbeIiQJVTfJefU_ONmsIDn-baM4O14KBC3KlZ3yZKvrh7BU15iQsW2bNhZKjHQaULNxSb-sdzeSkdtqZ_B8iWzt3HRgGCcKkPZLikMzO79sF1OPu_DIl2dZPQ2id30h3l6Y3dLlNp_qwlPKT02GMYMRYmfO4r4mn3_dQuXQcKlpnmjbvZKknzgsnrdacRShATyHLv806u6p1ckEOQHyzlMsJMXRlBlU",
      alt: "Assortment of mangoes, citrus, and grapes",
    },
    herbs: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvwOusPwZJSQGPqKKzpbccqJOTvfszq8l3acOINdjlOaxfVzFJ_WbtEPqKuGbL8KsQBsfgQYP1nhgvZufPmqYT136ACodqMFv0DMjdxSNsMkyZJEfk4BAjvLnMWZmjZUk5NLw2SJGFuBCtEMUsy2nCXKjrxGAF94sdZDrQsd8U2pTld0WjykIfIrcxISIPnRAGWtNXj9TPbmtQoylYEV3knDn0iBpdN5QQmwQ4WYHhEaFmlCTEL5fKABeQXYhzHrdsy17yYsIUEEo",
      alt: "Fresh basil, coriander, and micro greens",
    },
  },
  sustainability: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXkwrLBsa1IVqVXnDMmcy4RDUZEcsRl290ngAqbV8dCWOB4tjnLOQzIjwvhYW7vpGGo8RqouoNo3ZMvgDCgZ5s1Yj7qM30qu1RZeYR0zzn-WJXo73n_hbg-JVwOFkjZVuk77OhN6RIpq8LA93Fo-vX3-WNfyGdK6SvXdxrKv44gWDYiAT41LPI6cqmo0PR45NnkIM963Ua-rHehA7TmTJoxFVy1CB2S04r_eLRmge8r0AmbF7o6vbVriNAElVW7z90yCRTZ69itvc",
    alt: "IoT sensor equipment monitoring crop rows",
  },
  whyChoose: {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXkwrLBsa1IVqVXnDMmcy4RDUZEcsRl290ngAqbV8dCWOB4tjnLOQzIjwvhYW7vpGGo8RqouoNo3ZMvgDCgZ5s1Yj7qM30qu1RZeYR0zzn-WJXo73n_hbg-JVwOFkjZVuk77OhN6RIpq8LA93Fo-vX3-WNfyGdK6SvXdxrKv44gWDYiAT41LPI6cqmo0PR45NnkIM963Ua-rHehA7TmTJoxFVy1CB2S04r_eLRmge8r0AmbF7o6vbVriNAElVW7z90yCRTZ69itvc",
    alt: "Crop rows monitored by precision agriculture technology",
  },
} as const
