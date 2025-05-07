export interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

export interface AIAgentProps {
onExplore: (explore?: boolean) => void;
isAIAgentOnRight: boolean;
onPositionChange: (checked: boolean) => void;
}