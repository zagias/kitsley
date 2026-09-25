import './globals.css';
import './journey.css';
import './bookcase-workshop.css';
export const metadata = { title: 'Kitsley — Your home, handled.', description: 'Tools, steps and useful tips for your next DIY project. Start with what you own.' };
export default function RootLayout({children}) { return <html lang="en"><body>{children}</body></html>; }
