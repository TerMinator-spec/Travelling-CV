import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Travelling CV — Your Travel Resume',
  description: 'Build your travel resume, discover compatible travelers, and collaborate on trips. The LinkedIn for travelers.',
  keywords: 'travel, social platform, travel resume, trip collaboration, backpacking, digital nomad',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            <main>{children}</main>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
