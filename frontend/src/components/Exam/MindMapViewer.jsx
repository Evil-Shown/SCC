import React, { useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

const MindMapViewer = ({ mindMapData }) => {
    // Check if valid ReactFlow data format
    const isValidData = mindMapData && Array.isArray(mindMapData.nodes) && Array.isArray(mindMapData.edges);

    if (!isValidData) {
        return <div className="p-4 text-center text-gray-500">MindMap දත්ත දෝෂ සහිතයි (Invalid MindMap data)</div>;
    }

    // Initialize state with generated nodes and edges
    const [nodes, setNodes, onNodesChange] = useNodesState(mindMapData.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(mindMapData.edges);

    return (
        <div className="w-full h-[600px] border border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Background color="#f8fafc" gap={16} />
                <Controls />
                <MiniMap 
                    nodeColor={(n) => {
                        if (n.id === '1' || n.id === 'root') return '#3b82f6';
                        return '#9ca3af';
                    }} 
                />
            </ReactFlow>
            <div className="absolute top-4 left-4 bg-white/80 p-2 rounded text-xs text-gray-600 shadow z-10 pointer-events-none">
                මූසිකය (Mouse) භාවිතයෙන් MindMap එක Zoom/Pan කළ හැක.
            </div>
        </div>
    );
};

export default MindMapViewer;
