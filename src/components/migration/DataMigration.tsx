// src/components/migration/DataMigration.tsx
import React, { useState } from 'react'
import { Database, Upload, AlertTriangle, CheckCircle, RefreshCw, Download } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { 
  checkForLegacyData, 
  getLegacyDataSummary, 
  migrateDataToSupabase, 
  restoreFromBackup,
  clearLegacyData,
  MigrationResult 
} from '../../utils/dataMigration'

interface DataMigrationProps {
  onMigrationComplete?: () => void
}

const DataMigration: React.FC<DataMigrationProps> = ({ onMigrationComplete }) => {
  const [isChecking, setIsChecking] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [legacyDataExists, setLegacyDataExists] = useState(false)
  const [legacyDataSummary, setLegacyDataSummary] = useState({ users: 0, profiles: 0, relationships: 0 })

  React.useEffect(() => {
    checkLegacyData()
  }, [])

  const checkLegacyData = () => {
    setIsChecking(true)
    
    const hasLegacyData = checkForLegacyData()
    setLegacyDataExists(hasLegacyData)
    
    if (hasLegacyData) {
      const summary = getLegacyDataSummary()
      setLegacyDataSummary(summary)
    }
    
    setIsChecking(false)
  }

  const handleMigration = async () => {
    setIsMigrating(true)
    setMigrationResult(null)
    
    try {
      const result = await migrateDataToSupabase()
      setMigrationResult(result)
      
      if (result.success && onMigrationComplete) {
        setTimeout(() => {
          onMigrationComplete()
        }, 2000)
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        migratedUsers: 0,
        migratedProfiles: 0,
        migratedRelationships: 0,
        errors: [error instanceof Error ? error.message : 'Migration failed'],
        warnings: []
      })
    } finally {
      setIsMigrating(false)
    }
  }

  const handleRestoreBackup = () => {
    const restored = restoreFromBackup()
    if (restored) {
      checkLegacyData()
      setMigrationResult(null)
    }
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all legacy data? This cannot be undone.')) {
      clearLegacyData()
      checkLegacyData()
      setMigrationResult(null)
    }
  }

  if (isChecking) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin mr-2" size={20} />
          <span>Checking for legacy data...</span>
        </div>
      </Card>
    )
  }

  if (!legacyDataExists && !migrationResult) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Legacy Data Found
          </h3>
          <p className="text-gray-600">
            Your app is already using Supabase for data storage.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Migration Status */}
      {migrationResult && (
        <Card className={`border-l-4 ${migrationResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-start">
            {migrationResult.success ? (
              <CheckCircle className="text-green-500 mr-3 mt-0.5" size={20} />
            ) : (
              <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <h3 className={`font-medium ${migrationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {migrationResult.success ? 'Migration Completed!' : 'Migration Failed'}
              </h3>
              
              {migrationResult.success && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Successfully migrated:</p>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>{migrationResult.migratedUsers} user(s)</li>
                    <li>{migrationResult.migratedProfiles} profile(s)</li>
                    <li>{migrationResult.migratedRelationships} relationship(s)</li>
                  </ul>
                </div>
              )}
              
              {migrationResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm text-yellow-700">
                    {migrationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {migrationResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800">Errors:</p>
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm text-red-700">
                    {migrationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Migration Card */}
      <Card 
        title={
          <div className="flex items-center">
            <Database size={20} className="text-blue-600 mr-2" />
            <span>Data Migration to Supabase</span>
          </div>
        }
      >
        {legacyDataExists ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Legacy Data Found</h4>
              <p className="text-blue-700 text-sm mb-3">
                We found existing family tree data in your browser's local storage. 
                Migrate it to Supabase for better performance, security, and accessibility across devices.
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{legacyDataSummary.users}</div>
                  <div className="text-sm text-blue-700">Users</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{legacyDataSummary.profiles}</div>
                  <div className="text-sm text-blue-700">Profiles</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{legacyDataSummary.relationships}</div>
                  <div className="text-sm text-blue-700">Relationships</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Passwords cannot be migrated for security reasons</li>
                    <li>Only data for the currently logged-in user will be migrated</li>
                    <li>A backup will be created before migration</li>
                    <li>This process is irreversible once completed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={checkLegacyData}
                leftIcon={<RefreshCw size={16} />}
              >
                Refresh Check
              </Button>
              
              <div className="space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClearData}
                  size="sm"
                >
                  Clear Legacy Data
                </Button>
                
                <Button
                  onClick={handleMigration}
                  isLoading={isMigrating}
                  leftIcon={<Upload size={16} />}
                >
                  {isMigrating ? 'Migrating...' : 'Start Migration'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Migration Complete
            </h3>
            <p className="text-gray-600 mb-4">
              Your data has been successfully migrated to Supabase.
            </p>
            
            {localStorage.getItem('ak-families-backup') && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleRestoreBackup}
                  leftIcon={<Download size={16} />}
                  size="sm"
                >
                  Restore from Backup
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Migration Steps */}
      <Card title="Migration Process">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Backup Creation</h4>
              <p className="text-gray-600 text-sm">Create a backup of your existing data in localStorage</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Data Transfer</h4>
              <p className="text-gray-600 text-sm">Transfer profiles and relationships to Supabase database</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Cleanup</h4>
              <p className="text-gray-600 text-sm">Remove old data from localStorage after successful migration</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DataMigration