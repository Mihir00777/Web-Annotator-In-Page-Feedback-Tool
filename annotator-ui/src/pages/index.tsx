export default function Home() {
  const sendMessage = (action: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, { action });
      window.close();
    });
  };

  return (
    <div style={{
      width: 320,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: 0,
      fontFamily: '"Space Mono", monospace',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        background: 'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8
        }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
          }}>
            📌
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Web Annotator
            </h3>
            <p style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 400,
              letterSpacing: '0.5px'
            }}>
              Mark up the web
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '20px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        zIndex: 1
      }}>
        <button
          onClick={() => sendMessage("ENABLE_ADD_MODE")}
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 16px rgba(255,107,107,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,107,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,107,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            backdropFilter: 'blur(10px)'
          }}>
            ✏️
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              marginBottom: 2
            }}>
              Add Comment
            </div>
            <div style={{
              fontSize: 11,
              opacity: 0.85,
              fontWeight: 400
            }}>
              Select text or click links
            </div>
          </div>
          <div style={{
            fontSize: 18,
            opacity: 0.7
          }}>
            →
          </div>
        </button>

        <button
          onClick={() => sendMessage("TOGGLE_PANEL")}
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 18px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            background: 'rgba(78,205,196,0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16
          }}>
            📋
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              marginBottom: 2
            }}>
              View Annotations
            </div>
            <div style={{
              fontSize: 11,
              opacity: 0.6,
              fontWeight: 400
            }}>
              Manage all comments
            </div>
          </div>
          <div style={{
            fontSize: 18,
            opacity: 0.5
          }}>
            →
          </div>
        </button>
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '12px 24px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          letterSpacing: '0.5px',
          fontWeight: 400
        }}>
          💡 Click "Add Comment" then select any text
        </div>
      </div>

      {/* Add Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}