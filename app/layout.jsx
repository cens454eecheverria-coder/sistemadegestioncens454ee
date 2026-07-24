import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Sistema de Gestión - CENS 454 Esteban Echeverría',
  description: 'Sistema integral de gestión académica, asistencia, calificaciones y preinscripciones del CENS 454 de Esteban Echeverría (Región 5).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#F4FAFF]">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
