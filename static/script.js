const symbolTable = JSON.parse(localStorage.getItem('symbolTable')) || {};
let evaluatedExpressions = JSON.parse(localStorage.getItem('evaluatedExpressions')) || []; // Almacenará una copia de las expresiones evaluadas
let lastGeneratedTree = localStorage.getItem('lastGeneratedTree') || ''; // Para almacenar la última imagen generada

let executed = false; // Variable para verificar si se ha ejecutado
let tokensParsed = false; // Variable para verificar si se han mostrado los tokens

// Clase Scanner para tokenización
class Scanner {
  constructor(code) {
    this.code = code;
    this.TokenType = {
      PALABRA_RESERVADA: "PALABRA_RESERVADA",
      ID: "ID",
      NUM: "NUM",
      OPERADOR: "OPERADOR",
      SIMBOLO: "SIMBOLO",
      DESCONOCIDO: "DESCONOCIDO",
      EOF: "EOF"
    };
    this.palabrasReservadas = ["entero", "real", "si", "sino", "mientras", "fmientras", "fsi", "imprime", "verdadero", "falso"];
    this.linea = 1;
    this.tokenGenerator = null;
    this.lastToken = null;
  }

  *getGenerator() {
    let lexema = "";
    for (let i = 0; i < this.code.length; i++) {
      const char = this.code[i];

      if (char === '\n') {
        if (lexema) {
          yield this.clasificarLexema(lexema);
          lexema = "";
        }
        yield this.clasificarLexema('\n');
        this.linea++;
      } else if (char.match(/[\s,()=+\-*/^<>|&]/)) {
        if (lexema) {
          yield this.clasificarLexema(lexema);
          lexema = "";
        }
        if (!char.match(/\s/)) {
          yield this.clasificarLexema(char);
        }
      } else if (char.match(/[a-zA-Z0-9\.]/)) {
        lexema += char;
      } else if (char) {
        yield this.clasificarLexema(char);
      }
    }
    if (lexema) {
      yield this.clasificarLexema(lexema);
    }
  }

  clasificarLexema(lexema) {
    if (this.palabrasReservadas.includes(lexema)) {
      return { type: this.TokenType.PALABRA_RESERVADA, value: lexema, linea: this.linea };
    }
    if (lexema.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      return { type: this.TokenType.ID, value: lexema, linea: this.linea };
    }
    if (lexema.match(/^[0-9]+(\.[0-9]+)?$/)) {
      return { type: this.TokenType.NUM, value: lexema, linea: this.linea };
    }
    if (lexema.match(/[=+\-*/^<>|&]/)) {
      return { type: this.TokenType.OPERADOR, value: lexema, linea: this.linea };
    }
    if (lexema.match(/[\n,()]/)) {
      return { type: this.TokenType.SIMBOLO, value: lexema, linea: this.linea };
    }
    let tokenDesconocido = { type: this.TokenType.DESCONOCIDO, value: lexema, linea: this.linea };
    console.error("Error Léxico", tokenDesconocido);
    return tokenDesconocido;
  }

  getToken() {
    if (!this.tokenGenerator) {
      this.tokenGenerator = this.getGenerator();
    }

    const result = this.tokenGenerator.next();
    let actualToken;
    if (!result.done) {
      actualToken = result.value;
      if (!(actualToken.value === "\n" && (this.lastToken == null || this.lastToken.value === "\n"))) {
        this.lastToken = result.value;
        return result.value;
      } else {
        return this.getToken();
      }
    } else {
      return { type: this.TokenType.EOF, value: 'EOF', linea: this.linea };
    }
  }
}

// Clase Parser para análisis sintáctico
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.currentToken = null;
    this.index = 0;
    this.errorFlag = false;
    this.ast = null;
  }

  scanner() {
    if (this.index < this.tokens.length) {
      this.currentToken = this.tokens[this.index];
      this.index++;
    } else {
      this.currentToken = { type: 'EOF', value: 'EOF' }; // End of input
    }
  }

  main() {
    this.scanner();
    this.ast = this.expr();
    if (this.currentToken.type === 'EOF' && !this.errorFlag) {
      console.log("Cadena válida");
    } else {
      console.log("Error en la cadena");
    }
    return this.ast;
  }

  expr() {
    const termNode = this.term();
    return this.z(termNode);
  }

  z(leftNode) {
    if (this.currentToken.type === 'OPERADOR' && ['+', '-'].includes(this.currentToken.value)) {
      const operator = this.currentToken.value;
      this.scanner();
      const rightNode = this.expr();
      return { type: 'binOp', operator: operator, left: leftNode, right: rightNode };
    } else if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === ')') {
      // epsilon transition
      return leftNode;
    } else if (this.currentToken.type === 'EOF') {
      // epsilon transition
      return leftNode;
    } else {
      this.error();
      return null;
    }
  }

  term() {
    const factorNode = this.factor();
    return this.x(factorNode);
  }

  x(leftNode) {
    if (this.currentToken.type === 'OPERADOR' && ['*', '/'].includes(this.currentToken.value)) {
      const operator = this.currentToken.value;
      this.scanner();
      const rightNode = this.term();
      return { type: 'binOp', operator: operator, left: leftNode, right: rightNode };
    } else if (this.currentToken.type === 'OPERADOR' && ['+', '-'].includes(this.currentToken.value)) {
      // epsilon transition
      return leftNode;
    } else if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === ')') {
      // epsilon transition
      return leftNode;
    } else if (this.currentToken.type === 'EOF') {
      // epsilon transition
      return leftNode;
    } else {
      this.error();
      return null;
    }
  }

  factor() {
    if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === '(') {
      this.scanner();
      const exprNode = this.expr();
      if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === ')') {
        this.scanner();
        return exprNode;
      } else {
        this.error();
        return null;
      }
    } else if (this.currentToken.type === 'NUM') {
      const numNode = { type: 'num', value: parseFloat(this.currentToken.value) };
      this.scanner();
      return numNode;
    } else if (this.currentToken.type === 'ID') {
      const varNode = { type: 'var', name: this.currentToken.value };
      this.scanner();
      return varNode;
    } else {
      this.error();
      return null;
    }
  }

  error() {
    console.log("Error en la cadena");
    this.errorFlag = true;
  }
}

// Función para analizar expresiones aritméticas
function parseExpression(tokens) {
  const parser = new Parser(tokens);
  const ast = parser.main();
  if (parser.errorFlag) {
    throw new Error("Expresión inválida.");
  }
  return ast;
}

function scanExpression(expression) {
  const scanner = new Scanner(expression);
  const tokens = [];
  let token = scanner.getToken();
  while (token.type !== scanner.TokenType.EOF) {
    tokens.push(token);
    token = scanner.getToken();
  }
  return tokens;
}

document.addEventListener('DOMContentLoaded', () => {
  const viewValuesButton = document.getElementById('viewValuesButton');
  const executeButton = document.getElementById('executeButton');
  const showTokensButton = document.getElementById('showTokensButton');
  const generateTreeButton = document.getElementById('generateTreeButton');
  const showTreeButton = document.getElementById('showTreeButton');
  const clearStorageButton = document.getElementById('clearStorageButton');

  // Restaurar resultados y tokens en la interfaz de usuario
  document.getElementById('expression').value = localStorage.getItem('lastExpression') || '';
  updateResults();
  showTokens();
  showGeneratedTree(); // Mostrar el último árbol generado si existe

  viewValuesButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (executed) {
      evaluateExpression();
    } else {
      alert("Presione el botón 'Ejecutar' antes de ver los valores guardados.");
    }
  });

  executeButton.addEventListener('click', (event) => {
    event.preventDefault();
    evaluateExpression();
    executeExpression();
    executed = true; // Marcar que se ha ejecutado
  });

  showTokensButton.addEventListener('click', (event) => {
    event.preventDefault();
    showTokens();
    tokensParsed = true; // Marcar que se han mostrado los tokens
  });

  generateTreeButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (executed) {
      generateTreeFromCopy(event);
    } else {
      alert("Presione el botón 'Ejecutar' antes de generar el árbol.");
    }
  });

  showTreeButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (executed) {
      showGeneratedTree();
    } else {
      alert("Presione el botón 'Ejecutar' antes de mostrar el árbol.");
    }
  });

  clearStorageButton.addEventListener('click', (event) => {
    event.preventDefault();
    clearStorage();
  });
});

function evaluateExpression() {
  const expression = document.getElementById('expression').value.trim();
  const resultElement = document.getElementById('result');

  // Guardar la expresión en localStorage
  localStorage.setItem('lastExpression', expression);
  
  // Limpiar los resultados previos
  resultElement.innerHTML = '';
  evaluatedExpressions = []; // Limpiar las expresiones evaluadas previamente
  // Limpiar la tabla de símbolos
  Object.keys(symbolTable).forEach(key => delete symbolTable[key]);

  // Dividir las expresiones por ';' o saltos de línea
  const expressions = expression.split(/;|\n/);

  try {
    expressions.forEach(expr => {
      expr = expr.trim();
      if (expr && !expr.startsWith('cout<<')) { // Omitir expresiones cout
        const match = expr.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/i);
        if (match) {
          const varName = match[1];
          const exprValue = match[2];
          const tokens = scanExpression(exprValue);
          const ast = parseExpression(tokens);
          const result = evaluarAST(ast);
          symbolTable[varName] = result;
          evaluatedExpressions.push(exprValue); // Guardar solo la expresión
        } else {
          const tokens = scanExpression(expr);
          const ast = parseExpression(tokens);
          evaluarAST(ast);
          evaluatedExpressions.push(expr); // Guardar solo la expresión
        }
      }
    });

    // Guardar en localStorage
    localStorage.setItem('symbolTable', JSON.stringify(symbolTable));
    localStorage.setItem('evaluatedExpressions', JSON.stringify(evaluatedExpressions));

    updateResults();
  } catch (error) {
    resultElement.innerText = `Error: ${error.message}`;
  }
}

function executeExpression() {
  const expression = document.getElementById('expression').value.trim();
  const resultElement = document.getElementById('result');

  // Dividir las expresiones por ';' o saltos de línea
  const expressions = expression.split(/;|\n/);

  try {
    let output = '';

    expressions.forEach(expr => {
      expr = expr.trim();
      if (expr.startsWith('cout<<')) {
        const exprToEvaluate = expr.substring(6).trim();
        const tokens = scanExpression(exprToEvaluate);
        const ast = parseExpression(tokens);
        const result = evaluarAST(ast);
        output += `${result}\n`;
      } else if (expr) {
        const match = expr.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/i);
        if (match) {
          const varName = match[1];
          const exprValue = match[2];
          const tokens = scanExpression(exprValue);
          const ast = parseExpression(tokens);
          const result = evaluarAST(ast);
          symbolTable[varName] = result;
        } else {
          const tokens = scanExpression(expr);
          const ast = parseExpression(tokens);
          evaluarAST(ast);
        }
      }
    });

    if (output !== '') {
      resultElement.innerText = output.trim();
    } else {
      resultElement.innerText = 'No se encontró ninguna expresión cout<< para ejecutar.';
    }
  } catch (error) {
    resultElement.innerText = `Error: ${error.message}`;
  }
}

function generateTreeFromCopy(event) {
  event.preventDefault(); // Asegura que no se recargue la página al generar el árbol
  const lastExpression = evaluatedExpressions[evaluatedExpressions.length - 1]; // Obtener la última expresión evaluada
  console.log("Last evaluated expression:", lastExpression); // Debugging line
  if (lastExpression) {
    generateSyntaxTree(lastExpression);
  } else {
    console.error('No hay expresiones evaluadas para generar el árbol sintáctico');
    const treeElement = document.getElementById('syntax-tree');
    treeElement.innerHTML = '<p>No hay expresiones evaluadas para generar el árbol sintáctico</p>';
  }
}

function generateSyntaxTree(expression) {
  console.log("Expression sent to server:", expression); // Debugging line
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:5000/generate-syntax-tree', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const treeElement = document.getElementById('syntax-tree');
      const response = JSON.parse(xhr.responseText);
      if (response.success) {
        lastGeneratedTree = response.image;
        localStorage.setItem('lastGeneratedTree', lastGeneratedTree);
        treeElement.innerHTML = `<img src="data:image/png;base64,${response.image}" alt="Árbol Sintáctico">`;
      } else {
        console.error('Error al generar la imagen');
        treeElement.innerHTML = '<p>Error al generar la imagen</p>';
      }
    }
  };
  xhr.send(JSON.stringify({ expression }));
}

function showGeneratedTree() {
  const treeElement = document.getElementById('syntax-tree');
  if (lastGeneratedTree) {
    treeElement.innerHTML = `<img src="data:image/png;base64,${lastGeneratedTree}" alt="Árbol Sintáctico">`;
  } else {
    treeElement.innerHTML = '<p>No hay árbol sintáctico generado</p>';
  }
}

function evaluarAST(nodo) {
  if (nodo.type === 'num') {
    return nodo.value;
  } else if (nodo.type === 'var') {
    if (symbolTable.hasOwnProperty(nodo.name)) {
      return symbolTable[nodo.name];
    } else {
      throw new Error(`Variable ${nodo.name} no definida`);
    }
  } else if (nodo.type === 'binOp') {
    const leftValue = evaluarAST(nodo.left);
    const rightValue = evaluarAST(nodo.right);
    switch (nodo.operator) {
      case '+':
        return leftValue + rightValue;
      case '-':
        return leftValue - rightValue;
      case '*':
        return leftValue * rightValue;
      case '/':
        if (rightValue === 0) {
          throw new Error("División por cero");
        }
        return leftValue / rightValue;
      default:
        throw new Error(`Operador desconocido: ${nodo.operator}`);
    }
  } else {
    throw new Error(`Tipo de nodo desconocido: ${nodo.type}`);
  }
}

function updateResults() {
  const resultElement = document.getElementById('result');
  resultElement.innerHTML = '';
  for (const [key, value] of Object.entries(symbolTable)) {
    resultElement.innerHTML += `${key} = ${value}\n`;
  }
}

function showTokens(event) {
  const expression = document.getElementById('expression').value.trim();
  const tokensElement = document.getElementById('tokens');
  const tokens = scanExpression(expression);

  tokensElement.innerHTML = tokens.map(token => 
    `Tipo: ${token.type}, Valor: ${token.value}, Línea: ${token.linea}`).join('\n');
}

function clearStorage() {
  localStorage.removeItem('symbolTable');
  localStorage.removeItem('evaluatedExpressions');
  localStorage.removeItem('lastExpression');
  localStorage.removeItem('lastGeneratedTree');
  location.reload(); // Recargar la página para actualizar la interfaz
}
