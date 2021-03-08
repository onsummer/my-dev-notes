Cesium 中的线性代数：经典 Jacobi 算法求解特征值与特征向量



# 代码：Matrix3.computeEigenDecomposition()

``` js
var jMatrix = new Matrix3();
var jMatrixTranspose = new Matrix3();

Matrix3.computeEigenDecomposition = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  //>>includeEnd('debug');

  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.3 The Classical Jacobi Algorithm
  
  // 此方法是根据 Golub 和 Van Loan 的著作 《矩阵计算（第3版）》 第8.4.3节 “经典雅可比算法” 实现的

  var tolerance = CesiumMath.EPSILON20;
  var maxSweeps = 10;

  var count = 0;
  var sweep = 0;

  if (!defined(result)) {
    result = {};
  }

  // 特征向量矩阵（是一种酉矩阵），它每一列就是一个特征向量
  var unitaryMatrix = (result.unitary = Matrix3.clone(
    Matrix3.IDENTITY,
    result.unitary
  ));
  // 特征值对角线矩阵，对角线上的元素即特征值，开始时，先令其等于待计算的矩阵
  var diagMatrix = (result.diagonal = Matrix3.clone(matrix, result.diagonal));

  // 函数：computeFrobeniusNorm：计算Frobenius范数，所有元素平方和再开方
  var epsilon = tolerance * computeFrobeniusNorm(diagMatrix);

  // 函数：offDiagonalFrobeniusNorm：不知道计算什么的，取矩阵第 7、6、3 个元素（第一行后两个、第二行最后一个数字）进行双倍平方和再开方
  // 迭代十次 + 对角矩阵除了对角线外的元素全部为0，这两个条件满足任意一个就停止迭代
  while (sweep < maxSweeps && offDiagonalFrobeniusNorm(diagMatrix) > epsilon) {
    // 函数：shurDecomposition：
    shurDecomposition(diagMatrix, jMatrix);
    Matrix3.transpose(jMatrix, jMatrixTranspose);
    Matrix3.multiply(diagMatrix, jMatrix, diagMatrix);
    Matrix3.multiply(jMatrixTranspose, diagMatrix, diagMatrix);
    Matrix3.multiply(unitaryMatrix, jMatrix, unitaryMatrix);

    if (++count > 2) {
      ++sweep;
      count = 0;
    }
  }

  return result;
};
```





``` js
function computeFrobeniusNorm(matrix) {
  var norm = 0.0;
  for (var i = 0; i < 9; ++i) {
    var temp = matrix[i];
    norm += temp * temp;
  }

  return Math.sqrt(norm);
}

var rowVal = [1, 0, 0];
var colVal = [2, 2, 1];

// 计算的好像是主对角线右上角的3个元素的两倍平方和的开方数
// 似乎是假设矩阵是对称矩阵，求非对角线所有元素的和再开平方，验证是否等于0
function offDiagonalFrobeniusNorm(matrix) {
  // Computes the "off-diagonal" Frobenius norm.
  // Assumes matrix is symmetric.

  var norm = 0.0;
  for (var i = 0; i < 3; ++i) {
    var temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
    norm += 2.0 * temp * temp;
  }

  return Math.sqrt(norm);
}
```

