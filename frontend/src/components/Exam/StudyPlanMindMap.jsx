import React, { useEffect } from 'react';
import ReactFlow, { 
    MiniMap, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import { convertToReactFlowNodesAndEdges } from '../../utils/mindmapHelper';

// ✅ පියවර 1: nodeTypes සහ edgeTypes Component එකෙන් පිටත define කරන්න.
// මෙසේ කිරීමෙන් "new nodeTypes or edgeTypes object created" යන warning එක ඉවත් වේ.
const nodeTypes = {}; 
const edgeTypes = {};

const StudyPlanMindMap = ({ aiPlanData }) => {
    // Helper function එක හරහා මුල් දත්ත ලබා ගැනීම
    const initialElements = convertToReactFlowNodesAndEdges(aiPlanData);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

    // ✅ පියවර 2: aiPlanData අගය prop එකක් ලෙස වෙනස් වන විට (AI එකෙන් අලුත් Plan එකක් ලැබුණු විට)
    // Mind Map එක update වීමට මෙම useEffect එක භාවිතා වේ.
    useEffect(() => {
        if (aiPlanData) {
            const { nodes: newNodes, edges: newEdges } = convertToReactFlowNodesAndEdges(aiPlanData);
            setNodes(newNodes);
            setEdges(newEdges);
        }
    }, [aiPlanData, setNodes, setEdges]);

    return (
        <div className="exam-mindmap-frame">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes} // 👈 පියවර 3: Stable object එක pass කිරීම
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-left"
            >
                <MiniMap />
                <Controls />
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
};

export default StudyPlanMindMap;