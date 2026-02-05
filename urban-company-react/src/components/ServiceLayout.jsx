import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import ServiceCenterSection from "./ServiceCenterSection";

export default function ServiceLayout({menu, sections}) {
  return (
    <section className="service-page">
      <LeftSidebar menu={menu} />
      <ServiceCenterSection sections={sections} />
      <RightSidebar />
    </section>
  );
}
