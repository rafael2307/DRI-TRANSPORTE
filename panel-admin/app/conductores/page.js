'use client'
import { useState, useEffect } from 'react'

export default function ConductoresPage() {
    const [conductores, setConductores] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:3000/conductor/pending')
            .then(res => {
                if (!res.ok) throw new Error('Not ok');
                return res.json();
            })
            .then(data => {
                setConductores(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => {
                setConductores([])
                setLoading(false)
            })
    }, [])

    const handleApprove = async (id) => {
        await fetch(`http://localhost:3000/conductor/approve/${id}`, { method: 'PATCH' })
        setConductores(conductores.filter(c => c.id !== id))
        alert('Conductor aprobado exitosamente')
    }

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Aprobación de Conductores</h2>

            {loading ? (
                <p>Cargando...</p>
            ) : conductores.length === 0 ? (
                <p style={{ color: 'var(--secondary)' }}>No hay conductores pendientes de aprobación.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {conductores.map((c) => (
                        <div key={c.id} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--primary)', marginRight: '1rem' }} />
                                <div>
                                    <p style={{ fontWeight: 'bold' }}>{c.user?.name || 'Nuevo Conductor'}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{c.user?.email}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>DOCUMENTOS</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['DNI', 'Licencia', 'Vehículo'].map(doc => (
                                        <span key={doc} style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', border: '1px solid var(--glass-border)', borderRadius: '4px' }}>
                                            {doc}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleApprove(c.id)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Aprobar Registro
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
