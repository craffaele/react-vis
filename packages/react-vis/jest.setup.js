/*eslint-env node*/
import 'regenerator-runtime/runtime';
import jsdom from 'jsdom';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure({adapter: new Adapter()});

global.document = jsdom.jsdom('<body></body>');
global.window = document.defaultView;
Object.keys(document.defaultView).forEach(function mapProperties(property) {
  if (typeof global[property] === 'undefined') {
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};

/*
 * Canvas mocks
 */
HTMLCanvasElement.prototype.getContext = () => {};
