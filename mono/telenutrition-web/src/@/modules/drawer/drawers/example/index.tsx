import Drawer from 'react-modern-drawer';
import { ExampleDrawerData, OpenDrawerState } from '../../types';

import 'react-modern-drawer/dist/index.css';

export default function ExampleDrawer({ isOpen, closeDrawer }: OpenDrawerState<ExampleDrawerData>) {
  return (
    <Drawer open={isOpen} onClose={closeDrawer} direction="right">
      Yo yo yo this is an example!
    </Drawer>
  );
}
