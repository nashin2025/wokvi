import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store';
import { ProMode } from './ProMode';

export function ProjectView() {
  const { id } = useParams();
  const { currentProject, setCurrentProject } = useProjectStore();

  // In a real app, you'd fetch the project by ID
  // For now, just render the ProMode which will use currentProject
  return <ProMode />;
}