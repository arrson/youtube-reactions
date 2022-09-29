import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface CounterProps {
  from?: number;
  to: number;
}

const Counter = ({ from = 0, to }: CounterProps) => {
  const nodeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    const controls = animate(from, to, {
      duration: 1,
      onUpdate(value) {
        if (node) {
          node.textContent = value.toFixed(0);
        }
      },
    });

    return () => controls.stop();
  }, [from, to]);

  return <div ref={nodeRef} />;
};

export default Counter;
