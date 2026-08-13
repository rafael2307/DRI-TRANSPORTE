import './globals.css'
import Link from 'next/link'

export const metadata = {
    title: 'Panel de Administrador TranspApp',
    description: 'Centro de Control para TranspApp',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <div className="sidebar glass-card">
                    <h1 style={{ color: 'var(--primary)', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>TranspApp Admin</h1>
                    <nav>
                        <ul style={{ listStyle: 'none' }}>
                            {[
                                { name: 'Inicio', path: '/' },
                                { name: 'Conductores', path: '/conductores' },
                                { name: 'Retiros', path: '/retiros' },
                                { name: 'Pagos', path: '#' },
                                { name: 'Configuracion', path: '#' }
                            ].map((item) => (
                                <li key={item.name} style={{ padding: '0.75rem 0' }}>
                                    <Link href={item.path} style={{ color: 'var(--secondary)', textDecoration: 'none', cursor: 'pointer' }}>
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                <main className="main-content">
                    {children}
                </main>
            </body>
        </html>
    )
}
