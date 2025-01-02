declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'molstar/lib/mol-plugin-ui/skin/light.scss'; 