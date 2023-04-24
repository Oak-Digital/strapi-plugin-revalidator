import headRoutes from './head';
import headTypeRoutes from './head-type';
import defaultHeads from './default-head';

export default {
  'admin': {
    type: 'admin',
    routes: [
      ...headRoutes,
      ...headTypeRoutes,
      ...defaultHeads,
    ],
  }
};
