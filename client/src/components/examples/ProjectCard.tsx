import ProjectCard from '../ProjectCard';

export default function ProjectCardExample() {
  const handleViewClick = () => {
    console.log('View project clicked');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
      <ProjectCard
        id="1"
        code="PRJ-2024-001"
        title="Core Banking System Upgrade"
        type="Project"
        methodology="Waterfall"
        status="Kick Off"
        owner={{ name: "John Doe", initials: "JD" }}
        documentCount={8}
        onViewClick={handleViewClick}
      />
      <ProjectCard
        id="2"
        code="PRJ-2024-002"
        title="Mobile App Enhancement"
        type="Project"
        methodology="Agile"
        status="ARF"
        owner={{ name: "Jane Smith", initials: "JS" }}
        documentCount={12}
        onViewClick={handleViewClick}
      />
      <ProjectCard
        id="3"
        code="NP-2024-015"
        title="Security Audit Q1"
        type="Non-Project"
        methodology="Agile"
        status="Go Live"
        owner={{ name: "Mike Johnson", initials: "MJ" }}
        documentCount={5}
        onViewClick={handleViewClick}
      />
    </div>
  );
}
