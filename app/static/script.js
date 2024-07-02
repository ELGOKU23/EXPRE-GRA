const symbolTable = JSON.parse(localStorage.getItem('symbolTable')) || {};
let evaluatedExpressions = JSON.parse(localStorage.getItem('evaluatedExpressions')) || []; // Almacenará una copia de las expresiones evaluadas
let lastGeneratedTree = localStorage.getItem('lastGeneratedTree') || ''; // Para almacenar la última imagen generada

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
    this.expr();
    if (this.currentToken.type === 'EOF' && !this.errorFlag) {
      console.log("Cadena válida");
    } else {
      console.log("Error en la cadena");
    }
  }

  expr() {
    this.term();
    this.z();
  }

  z() {
    if (this.currentToken.type === 'OPERADOR' && ['+', '-'].includes(this.currentToken.value)) {
      this.scanner();
      this.expr();
    } else if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === ')') {
      // epsilon transition
    } else if (this.currentToken.type === 'EOF') {
      // epsilon transition
    } else {
      this.error();
    }
  }

  term() {
    this.factor();
    this.x();
  }

  x() {
    if (this.currentToken.type === 'OPERADOR' && ['*', '/'].includes(this.currentToken.value)) {
      this.scanner();
      this.term();
    } else if (this.currentToken.type === 'OPERADOR' && ['+', '-'].includes(this.currentToken.value)) {
      // epsilon transition
    } else if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === ')') {
      // epsilon transition
    } else if (this.currentToken.type === 'EOF') {
      // epsilon transition
    } else {
      this.error();
    }
  }

  factor() {
    if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === '(') {
      this.scanner();
      this.expr();
      if (this.currentToken.type === 'SIMBOLO' && this.currentToken.value === ')') {
        this.scanner();
      } else {
        this.error();
      }
    } else if (this.currentToken.type === 'NUM') {
      this.scanner();
    } else if (this.currentToken.type === 'ID') {
      this.scanner();
    } else {
      this.error();
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
  parser.main();
  if (parser.errorFlag) {
    throw new Error("Expresión inválida.");
  }
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
  const evaluateButton = document.getElementById('evaluateButton');
  const showTokensButton = document.getElementById('showTokensButton');
  const generateTreeButton = document.getElementById('generateTreeButton');
  const showTreeButton = document.getElementById('showTreeButton');
  const clearStorageButton = document.getElementById('clearStorageButton');

  // Restaurar resultados y tokens en la interfaz de usuario
  document.getElementById('expression').value = localStorage.getItem('lastExpression') || '';
  updateResults();
  showTokens();
  showGeneratedTree(); // Mostrar el último árbol generado si existe

  evaluateButton.addEventListener('click', (event) => {
    event.preventDefault();
    evaluateExpression();
  });

  showTokensButton.addEventListener('click', (event) => {
    event.preventDefault();
    showTokens();
  });

  generateTreeButton.addEventListener('click', (event) => {
    event.preventDefault();
    generateTreeFromCopy(event);
  });

  showTreeButton.addEventListener('click', (event) => {
    event.preventDefault();
    showGeneratedTree();
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
      if (expr) {
        const match = expr.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
        if (match) {
          const varName = match[1];
          const exprValue = match[2];
          const tokens = scanExpression(exprValue);
          parseExpression(tokens);
          const result = evalTokens(tokens);
          symbolTable[varName] = result;
          evaluatedExpressions.push(exprValue); // Guardar una copia de la expresión evaluada
        } else {
          const tokens = scanExpression(expr);
          parseExpression(tokens);
          evaluatedExpressions.push(expr); // Guardar una copia de la expresión
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

function generateTreeFromCopy(event) {
  event.preventDefault(); // Asegura que no se recargue la página al generar el árbol
  const lastExpression = evaluatedExpressions[evaluatedExpressions.length - 1]; // Obtener la última expresión evaluada
  if (lastExpression) {
    generateSyntaxTree(lastExpression);
  } else {
    console.error('No hay expresiones evaluadas para generar el árbol sintáctico');
    const treeElement = document.getElementById('syntax-tree');
    treeElement.innerHTML = '<p>No hay expresiones evaluadas para generar el árbol sintáctico</p>';
  }
}

function generateSyntaxTree(expression) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/generate-syntax-tree', true);  // Usar ruta relativa
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

function evalTokens(tokens) {
  const expr = tokens.map(token => {
    if (token.type === 'ID') {
      if (symbolTable.hasOwnProperty(token.value)) {
        return symbolTable[token.value];
      } else {
        throw new Error(`Variable ${token.value} no definida`);
      }
    }
    return token.value;
  }).join(' ');
  return eval(expr);
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
