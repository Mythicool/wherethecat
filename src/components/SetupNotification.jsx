import { useState } from 'react'
import { AlertTriangle, ExternalLink, X, Copy, Check } from 'lucide-react'
import './SetupNotification.css'

function SetupNotification() {
  const [isVisible, setIsVisible] = useState(true)
  const [copied, setCopied] = useState(false)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Don't show if Supabase is properly configured
  if (supabaseUrl && supabaseKey && 
      supabaseUrl !== 'your_supabase_project_url' && 
      supabaseKey !== 'your_supabase_anon_key') {
    return null
  }

  if (!isVisible) return null

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const envTemplate = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`

  return (
    <div className="setup-notification-overlay">
      <div className="setup-notification">
        <div className="setup-header">
          <div className="setup-title">
            <AlertTriangle className="setup-icon" />
            <h2>Supabase Setup Required</h2>
          </div>
          <button 
            className="setup-close"
            onClick={() => setIsVisible(false)}
            title="Dismiss (you can still use the app in demo mode)"
          >
            <X size={20} />
          </button>
        </div>

        <div className="setup-content">
          <p className="setup-description">
            To use all features including user authentication, photo uploads, and real-time updates, 
            you need to configure Supabase. Don't worry - it's free and takes just a few minutes!
          </p>

          <div className="setup-steps">
            <div className="setup-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create a Supabase Project</h3>
                <p>Sign up at Supabase and create a new project</p>
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="setup-link"
                >
                  Go to Supabase <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="setup-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Get Your Credentials</h3>
                <p>Copy your Project URL and anon public key from Settings → API</p>
              </div>
            </div>

            <div className="setup-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Update Environment Variables</h3>
                <p>Replace the values in your <code>.env.local</code> file:</p>
                <div className="code-block">
                  <pre>{envTemplate}</pre>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(envTemplate)}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="setup-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Run Database Setup</h3>
                <p>Execute the SQL commands from <code>supabase-setup.sql</code> in your Supabase SQL Editor</p>
              </div>
            </div>

            <div className="setup-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Restart Development Server</h3>
                <p>Stop and restart <code>npm run dev</code> to load the new environment variables</p>
              </div>
            </div>
          </div>

          <div className="setup-footer">
            <div className="setup-note">
              <strong>Note:</strong> You can still explore the app in demo mode, but features like 
              user accounts, photo uploads, and data persistence won't work until Supabase is configured.
            </div>
            
            <div className="setup-links">
              <a 
                href="https://github.com/your-repo/blob/main/SUPABASE_SETUP_GUIDE.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="setup-guide-link"
              >
                📖 Detailed Setup Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupNotification
