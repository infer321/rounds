import FindingsBuilder from '../components/FindingsBuilder';
import { ROS_SECTIONS } from '../data/rosSections';

export default function ROSBuilderScreen() {
  return (
    <FindingsBuilder title="Review of systems" sections={ROS_SECTIONS} field="rosFindings"
      posWord="reports" negWord="denies" allNegLabel="Denies all" />
  );
}
