export default function Dashboard() {
    const stats = [
        { label: 'Viajes Hoy', value: '142', trend: '+12%', color: 'var(--primary)' },
        { label: 'Conductores Activos', value: '45', trend: '+3', color: 'var(--success)' },
        { label: 'Ingresos Brutos', value: '$1.250.000', trend: '+8%', color: 'var(--accent)' },
        { label: 'Alertas Pendientes', value: '3', trend: '-2', color: 'var(--error)' },
    ];

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Panel Principal</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {stats.map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: '1.5rem' }}>
                        <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>{stat.trend} vs ayer</p>
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Viajes Recientes</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--secondary)' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Pasajero</th>
                            <th style={{ padding: '1rem' }}>Conductor</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                            <th style={{ padding: '1rem' }}>Tarifa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3].map((i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem' }}>#T-{1000 + i}</td>
                                <td style={{ padding: '1rem' }}>Juan Perez</td>
                                <td style={{ padding: '1rem' }}>Carlos Gomez</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontSize: '0.75rem' }}>
                                        COMPLETADO
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>$12.500</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
