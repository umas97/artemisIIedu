import katex from 'katex';

export function math(node, { expression, displayMode = false }) {
  const update = (expr) => {
    katex.render(expr, node, {
      displayMode,
      throwOnError: false
    });
  };

  update(expression);

  return {
    update({ expression: nextExpr }) {
      update(nextExpr);
    }
  };
}
