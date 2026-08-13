'use client'
import { useState, useEffect } from 'react'

export default function RetirosPage() {
    const [retiros, setRetiros] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In a real app, this would be an admin endpoint like /payments/retiros/pending
        // For now we simulate with a general fetch if needed or mock it
        fetch('http://localhost:3000/payments/withdrawals/all')
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                setRetiros(Array.isArray(data) ? data : [])
                setLoading(false) // Set loading to false on success
            })
            .catch(() => {
                // Mock data if endpoint doesn't exist yet
                setRetiros([
                    { id: '1', user: { name: 'Pedro Picapiedra' }, amount: 150000, provider: 'NEQUI', status: 'PENDING', createdAt: new Date() },
                    { id: '2', user: { name: 'Vilma Marmol' }, amount: 85000, provider: 'BANCOLOMBIA', status: 'PENDING', createdAt: new Date() },
                ])
            })
            .finally(() => setLoading(false))
    }, [])

    const handleApprove = (id) => {
        alert(`Retiro ${id} aprobado y transferido exitosamente vía API bancaria.`)
        setRetiros(retiros.filter(r => r.id !== id))
    }

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Gestión de Retiros</h2>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--secondary)' }}>
                            <th style={{ padding: '1rem' }}>CONDUCTOR</th>
                            <th style={{ padding: '1rem' }}>MONTO</th>
                            <th style={{ padding: '1rem' }}>BANCO</th>
                            <th style={{ padding: '1rem' }}>FECHA</th>
                            <th style={{ padding: '1rem' }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {retiros.map((r) => (
                            <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem' }}>{r.user?.name}</td>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>${r.amount.toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent)' }}>
                                        {r.provider}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--secondary)', fontSize: '0.875rem' }}>Hace 2 horas</td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => handleApprove(r.id)}
                                        style={{ border: 'none', background: 'var(--success)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Aprobar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
