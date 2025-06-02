// Family tree visualization component

import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Users } from 'lucide-react';
import Button from '../ui/Button';
import TreeNode from './TreeNode';
import ProfileCard from '../profile/ProfileCard';
import { buildFamilyTree, TreeNode as TreeNodeType } from '../../services/family';
import { getProfileById } from '../../services/localStorage';
import { Profile } from '../../types';

interface FamilyTreeProps {
  rootProfileId: string;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ rootProfileId }) => {
  const [treeData, setTreeData] = useState<TreeNodeType | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(rootProfileId);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  useEffect(() => {
    // Build the family tree
    const tree = buildFamilyTree(rootProfileId);
    setTreeData(tree);
    
    // Set selected profile
    const profile = getProfileById(rootProfileId);
    if (profile) {
      setSelectedProfile(profile);
    }
  }, [rootProfileId]);
  
  const handleNodeClick = (profileId: string) => {
    setSelectedNodeId(profileId);
    
    const profile = getProfileById(profileId);
    if (profile) {
      setSelectedProfile(profile);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  if (!treeData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No family tree data available.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users size={24} className="text-teal-600 mr-2" />
          Family Tree
        </h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            leftIcon={<ZoomOut size={16} />}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            leftIcon={<ZoomIn size={16} />}
          >
            Zoom In
          </Button>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 overflow-auto">
        <div 
          className="flex justify-center min-h-[400px]"
          style={{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease',
          }}
        >
          <TreeNode 
            node={treeData} 
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        </div>
      </div>
      
      {selectedProfile && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Selected Family Member</h3>
          <ProfileCard profile={selectedProfile} showEditButton={false} />
        </div>
      )}
    </div>
  );
};

export default FamilyTree;