// Tree node component for the family tree visualization

import React from 'react';
import { Scale as Male, Scale as Female, User } from 'lucide-react';
import { TreeNode as TreeNodeType } from '../../services/family';

interface TreeNodeProps {
  node: TreeNodeType;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onNodeClick, selectedNodeId }) => {
  const isSelected = selectedNodeId === node.profileId;
  
  const getNodeStyles = () => {
    const baseStyles = `
      relative
      flex
      flex-col
      items-center
      p-3
      rounded-lg
      border
      transition-all
      duration-200
      cursor-pointer
      ${isSelected ? 'shadow-md transform scale-105' : 'shadow-sm hover:shadow'}
    `;
    
    if (isSelected) {
      return `${baseStyles} border-teal-500 bg-teal-50`;
    }
    
    if (node.gender === 'male') {
      return `${baseStyles} border-blue-300 bg-blue-50 hover:bg-blue-100`;
    } else if (node.gender === 'female') {
      return `${baseStyles} border-pink-300 bg-pink-50 hover:bg-pink-100`;
    } else {
      return `${baseStyles} border-gray-300 bg-gray-50 hover:bg-gray-100`;
    }
  };
  
  const getGenderIcon = () => {
    const size = 24;
    
    if (node.gender === 'male') {
      return <Male size={size} className="text-blue-600" />;
    } else if (node.gender === 'female') {
      return <Female size={size} className="text-pink-600" />;
    } else {
      return <User size={size} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div
        className={getNodeStyles()}
        onClick={() => onNodeClick(node.profileId)}
      >
        <div className="mb-1">{getGenderIcon()}</div>
        <div className="text-center">
          <div className="font-medium text-sm">{node.name}</div>
        </div>
      </div>
      
      {(node.children.length > 0 || node.spouse) && (
        <div className="w-px h-4 bg-gray-300 my-2"></div>
      )}
      
      {/* Spouse and Children container */}
      {(node.spouse || node.children.length > 0) && (
        <div className="flex flex-col items-center">
          {/* Spouse node */}
          {node.spouse && (
            <div className="flex items-center mb-4">
              <div className="h-px w-10 bg-gray-300"></div>
              <div
                className={`
                  relative
                  flex
                  flex-col
                  items-center
                  p-3
                  rounded-lg
                  border
                  shadow-sm
                  transition-all
                  duration-200
                  cursor-pointer
                  ${node.spouse.gender === 'male' ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' : 'border-pink-300 bg-pink-50 hover:bg-pink-100'}
                `}
                onClick={() => onNodeClick(node.spouse!.profileId)}
              >
                <div className="mb-1">
                  {node.spouse.gender === 'male' ? (
                    <Male size={24} className="text-blue-600" />
                  ) : (
                    <Female size={24} className="text-pink-600" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{node.spouse.name}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Children nodes */}
          {node.children.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-gray-300 mb-2"></div>
              <div className="w-full flex flex-wrap justify-center gap-4">
                {node.children.map((child) => (
                  <TreeNode
                    key={child.id}
                    node={child}
                    onNodeClick={onNodeClick}
                    selectedNodeId={selectedNodeId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TreeNode;