import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Horizontal, swipeable row with arrow buttons on larger screens.
export default function ScrollRow({ children, label }) {
  const ref = useRef(null);

  function scroll(direction) {
    const node = ref.current;
    if (node) node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="scrollrow">
      <button className="scrollrow-arrow prev" onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}>
        <ChevronLeft size={20} />
      </button>
      <div className="scrollrow-track" ref={ref} role="list" aria-label={label}>
        {children}
      </div>
      <button className="scrollrow-arrow next" onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
