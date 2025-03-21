import * as React from "react";

interface DividerProps {
  text?: string;
}

const Divider: React.FC<DividerProps> = ({ text }) => {
  return (
    <div className="relative flex items-center">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t"></span>
      </div>
      {text && (
        <div className="relative flex w-full justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            {text}
          </span>
        </div>
      )}
    </div>
  );
};

export default Divider;
