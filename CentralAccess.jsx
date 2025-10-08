
import { useState } from 'react';

export default function CentralAccess() {
  const [node, setNode] = useState('');
  const [intention, setIntention] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', textAlign: 'center' }}>🌐 Central</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>
        Bem-vindo, nó fundacional. Aqui começa a revolução.
      </p>

      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <label>
            Número do Nó:
            <input
              type="text"
              value={node}
              onChange={(e) => setNode(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginBottom: '1rem' }}
            />
          </label>
          <label>
            Intenção Inicial:
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              rows="4"
              required
              style={{ width: '100%', padding: '8px', marginBottom: '1rem' }}
            />
          </label>
          <button type="submit" style={{ width: '100%', padding: '10px' }}>
            Ingressar na Central
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p><strong>Nó:</strong> {node}</p>
          <p><em>"{intention}"</em></p>
          <p style={{ color: 'green' }}>Intenção registrada. Você agora está conectado.</p>
        </div>
      )}
    </div>
  );
}
