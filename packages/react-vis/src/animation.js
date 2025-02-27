import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {interpolate} from 'd3-interpolate';
import {spring, Motion, presets} from '@korbav/react-motion';

const ANIMATION_PROPTYPES = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    stiffness: PropTypes.number,
    nonAnimatedProps: PropTypes.arrayOf(PropTypes.string),
    damping: PropTypes.number
  }),
  PropTypes.bool
]);

const propTypes = {
  animatedProps: PropTypes.arrayOf(PropTypes.string).isRequired,
  animation: ANIMATION_PROPTYPES,
  onStart: PropTypes.func,
  onEnd: PropTypes.func
};

/**
 * Format the animation style object
 * @param {Object|String} animationStyle - The animation style property, either the name of a
 * presets are one of noWobble, gentle, wobbly, stiff
 */
function getAnimationStyle(animationStyle = presets.noWobble) {
  if (typeof animationStyle === 'string') {
    return presets[animationStyle] || presets.noWobble;
  }
  const {damping, stiffness} = animationStyle;
  return {
    ...animationStyle,
    damping: damping || presets.noWobble.damping,
    stiffness: stiffness || presets.noWobble.stiffness
  };
}

/**
 * Extract the animated props from the entire props object.
 * @param {Object} props Props.
 * @returns {Object} Object of animated props.
 */
export function extractAnimatedPropValues(props) {
  const {animatedProps, ...otherProps} = props;

  return animatedProps.reduce((result, animatedPropName) => {
    if (Object.prototype.hasOwnProperty.call(otherProps, animatedPropName)) {
      result[animatedPropName] = otherProps[animatedPropName];
    }
    return result;
  }, {});
}

class Animation extends PureComponent {
  constructor(props) {
    super(props);
    this._updateInterpolator(props);
  }

  UNSAFE_componentWillUpdate(props) {
    this._updateInterpolator(this.props, props);
    if (props.onStart) {
      props.onStart();
    }
  }

  _motionEndHandler = () => {
    if (this.props.onEnd) {
      this.props.onEnd();
    }
  };

  /**
   * Render the child into the parent.
   * @param {Number} i Number generated by the spring.
   * @returns {React.Component} Rendered react element.
   * @private
   */
  _renderChildren = ({i}) => {
    const {children} = this.props;
    const interpolator = this._interpolator;
    const child = React.Children.only(children);
    const interpolatedProps = interpolator ? interpolator(i) : interpolator;

    // interpolator doesnt play nice with deeply nested objected
    // so we expose an additional prop for situations like these, soit _data,
    // which stores the full tree and can be recombined with the sanitized version
    // after interpolation
    let data = (interpolatedProps && interpolatedProps.data) || null;
    if (data && child.props._data) {
      data = data.map((row, index) => {
        const correspondingCell = child.props._data[index];
        return {
          ...row,
          parent: correspondingCell.parent,
          children: correspondingCell.children
        };
      });
    }

    return React.cloneElement(child, {
      ...child.props,
      ...interpolatedProps,
      data: data || child.props.data || null,
      // enforce re-rendering
      _animation: Math.random()
    });
  };

  /**
   * Update the interpolator function and assign it to this._interpolator.
   * @param {Object} oldProps Old props.
   * @param {Object} newProps New props.
   * @private
   */
  _updateInterpolator(oldProps, newProps) {
    this._interpolator = interpolate(
      extractAnimatedPropValues(oldProps),
      newProps ? extractAnimatedPropValues(newProps) : null
    );
  }

  render() {
    const animationStyle = getAnimationStyle(this.props.animation);
    const defaultStyle = {i: 0};
    const style = {i: spring(1, animationStyle)};
    // In order to make Motion re-run animations each time, the random key is
    // always passed.
    // TODO: find a better solution for the spring.
    const key = Math.random();
    return (
      <Motion {...{defaultStyle, style, key}} onRest={this._motionEndHandler}>
        {this._renderChildren}
      </Motion>
    );
  }
}

Animation.propTypes = propTypes;
Animation.displayName = 'Animation';

export default Animation;

export const AnimationPropType = ANIMATION_PROPTYPES;
