// src/components/debug/SupabaseDebug.tsx
import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface DebugInfo {
  envVars: {
    url: string | undefined
    anonKey: string | undefined
  }
  connection: {
    status: 'checking' | 'connected' | 'failed'
    error?: string
  }
  auth: {
    session: any
    user: any
  }
  database: {
    canConnect: boolean
    error?: string
  }
}

const SupabaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    envVars: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    connection: {
      status: 'checking'
    },
    auth: {
      session: null,
      user: null
    },
    database: {
      canConnect: false
    }
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  const checkSupabaseConnection = async () => {
    setIsRefreshing(true)
    
    try {
      console.log('Checking Supabase connection...')
      
      // Check environment variables
      const envVars = {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      }

      // Check auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Test database connection
      let dbConnection = { canConnect: false, error: undefined }
      try {
        // Simple query to test connection
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        dbConnection = {
          canConnect: !dbError,
          error: dbError?.message
        }
      } catch (dbError) {
        dbConnection = {
          canConnect: false,
          error: dbError instanceof Error ? dbError.message : 'Database connection failed'
        }
      }

      setDebugInfo({
        envVars,
        connection: {
          status: envVars.url && envVars.anonKey ? 'connected' : 'failed',
          error: !envVars.url || !envVars.anonKey ? 'Missing environment variables' : undefined
        },
        auth: {
          session,
          user: session?.user || null
        },
        database: dbConnection
      })

    } catch (error) {
      console.error('Debug check failed:', error)
      setDebugInfo(prev => ({
        ...prev,
        connection: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setIsRefreshing(false)
    }
  }

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      
      console.log('Test login result:', { data, error })
    } catch (error) {
      console.error('Test login failed:', error)
    }
  }

  const StatusIcon: React.FC<{ status: boolean | 'unknown' }> = ({ status }) => {
    if (status === true) return <CheckCircle className="text-green-500" size={20} />
    if (status === false) return <XCircle className="text-red-500" size={20} />
    return <AlertTriangle className="text-yellow-500" size={20} />
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card title="Supabase Configuration Debug">
        <div className="space-y-6">
          {/* Environment Variables */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <Info size={20} className="mr-2 text-blue-500" />
              Environment Variables
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">VITE_SUPABASE_URL</span>
                <div className="flex items-center">
                  <StatusIcon status={!!debugInfo.envVars.url} />
                  <span className="ml-2 text-sm text-gray-600">
                    {debugInfo.envVars.url ? `${debugInfo.envVars.url.substring(0, 30)}...` : 'Not set'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">VITE_SUPABASE_ANON_KEY</span>
                <div className="flex items-center">
                  <StatusIcon status={!!debugInfo.envVars.anonKey} />
                  <span className="ml-2 text-sm text-gray-600">
                    {debugInfo.envVars.anonKey ? `${debugInfo.envVars.anonKey.substring(0, 20)}...` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <Info size={20} className="mr-2 text-blue-500" />
              Connection Status
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span>Supabase Client</span>
                <div className="flex items-center">
                  <StatusIcon status={debugInfo.connection.status === 'connected'} />
                  <span className="ml-2 text-sm text-gray-600">
                    {debugInfo.connection.status}
                    {debugInfo.connection.error && ` - ${debugInfo.connection.error}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <Info size={20} className="mr-2 text-blue-500" />
              Authentication Status
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Current Session</span>
                <div className="flex items-center">
                  <StatusIcon status={!!debugInfo.auth.session} />
                  <span className="ml-2 text-sm text-gray-600">
                    {debugInfo.auth.session ? 'Active' : 'None'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Current User</span>
                <div className="flex items-center">
                  <StatusIcon status={!!debugInfo.auth.user} />
                  <span className="ml-2 text-sm text-gray-600">
                    {debugInfo.auth.user?.email || 'Not logged in'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <Info size={20} className="mr-2 text-blue-500" />
              Database Status
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span>Database Connection</span>
                <div className="flex items-center">
                  <StatusIcon status={debugInfo.database.canConnect} />
                  <span className="ml-2 text-sm text-gray-600">
                    {debugInfo.database.canConnect ? 'Connected' : 'Failed'}
                    {debugInfo.database.error && ` - ${debugInfo.database.error}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <Button
              onClick={checkSupabaseConnection}
              isLoading={isRefreshing}
              variant="outline"
            >
              Refresh Status
            </Button>
            <Button
              onClick={testLogin}
              variant="outline"
            >
              Test Login
            </Button>
            <Button
              onClick={() => console.log('Full Debug Info:', debugInfo)}
              variant="outline"
            >
              Log Debug Info
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Troubleshooting Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Make sure you have created a Supabase project</li>
              <li>Copy your project URL and anon key from Settings → API</li>
              <li>Create `.env.local` file in your project root</li>
              <li>Add the environment variables and restart the dev server</li>
              <li>Run the SQL schema from the migration guide</li>
              <li>Test registration with a new email address</li>
            </ol>
          </div>

          {/* Sample Environment File */}
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4">
            <h4 className="font-medium mb-2">Sample .env.local file:</h4>
            <pre className="text-sm">
{`VITE_SUPABASE_URL=https://nrrxoawylrkuakwcpazd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycnhvYXd5bHJrdWFrd2NwYXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NjIyMjYsImV4cCI6MjA2NDQzODIyNn0.Y4KEkZjYTG__elhhFC0BeFg12Mn2-geP9bW0CHpaKWs`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SupabaseDebug