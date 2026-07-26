import { sanitize, defaultSchema } from 'hast-util-sanitize';

const schema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src || []), 'data']
  }
};

const tree = {
  type: 'element',
  tagName: 'img',
  properties: {
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  },
  children: []
};

console.log(JSON.stringify(sanitize(tree, schema), null, 2));
