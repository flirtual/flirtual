// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IconComponentProps = React.ComponentProps<"svg"> & { ref?: any };
export type IconComponent = React.FC<IconComponentProps>;

export * from "./brand";
