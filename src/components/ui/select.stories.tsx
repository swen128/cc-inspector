import type { Story } from "@ladle/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export default {
  title: "UI / Select",
};

export const Default: Story = () => (
  <Select defaultValue="option-1">
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Choose an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option-1">Option One</SelectItem>
      <SelectItem value="option-2">Option Two</SelectItem>
      <SelectItem value="option-3">Option Three</SelectItem>
    </SelectContent>
  </Select>
);

export const WithPlaceholder: Story = () => (
  <Select>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Select a fruit..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="cherry">Cherry</SelectItem>
    </SelectContent>
  </Select>
);

export const SmallSize: Story = () => (
  <Select defaultValue="sm-1">
    <SelectTrigger size="sm" className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="sm-1">Small One</SelectItem>
      <SelectItem value="sm-2">Small Two</SelectItem>
    </SelectContent>
  </Select>
);
