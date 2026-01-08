/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#db2777', // Pink-600 (User likes pink/white?) - User said "Pink and White" in another convo? 
                    // Wait, the current request didn't specify color.
                    // BUT "Smart Warfarin" request (Conversation 18) mentioned "Pink and White".
                    // This request (Home NCD-NHH) just said "Premium". 
                    // I will use a modern palette. Blue/Indigo is safe for medical, but Teal/Emerald is good for "Home/Community".
                    // Let's stick to a premium Slate/Indigo theme or Teal.
                    // Let's use a nice Indigo/Rose mix.
                    50: '#fdf2f8',
                    100: '#fce7f3',
                    500: '#ec4899', // Pink-500
                    600: '#db2777',
                    700: '#be185d',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
