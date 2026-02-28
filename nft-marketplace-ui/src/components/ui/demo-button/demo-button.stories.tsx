import { PlusCircle } from "lucide-react";
import { DemoButton } from "./demo-button.js";

const meta = {
  title: "Components/DemoButton",
  component: DemoButton,
};

export default meta;

const variants = ["default", "secondary", "destructive", "outline", "link"] as const;

export function Default(): JSX.Element {
  return (
    <div className="flex flex-row gap-8">
      {variants.map(variant => (
        <DemoButton key={variant} variant={variant}>
          {variant}
        </DemoButton>
      ))}
    </div>
  );
}

const SIZES = ["sm", "default", "lg", "icon"] as const;

export function Sizes(): JSX.Element {
  return (
    <div className="flex flex-row gap-8">
      {SIZES.map(size => (
        <DemoButton key={size} size={size}>
          {size !== "icon" && size}
          {size === "icon" && <PlusCircle />}
        </DemoButton>
      ))}
    </div>
  );
}

export function WithIcon(): JSX.Element {
  return (
    <DemoButton>
      <PlusCircle className="mr-2 size-4" />
      Add
    </DemoButton>
  );
}
