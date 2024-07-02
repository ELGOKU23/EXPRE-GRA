<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evaluador de Expresiones Aritméticas</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="{{ url_for('static', filename='script.js') }}" defer></script>
</head>
<body>
    <header>
        <h1>Evaluador de Expresiones Aritméticas</h1>
    </header>
    <main class="container">
        <!-- Sección 1: Evaluación de Expresiones -->
        <section class="input-section">
            <label for="expression">Ingrese expresiones, separadas por ';' o salto de línea:</label>
            <textarea id="expression" placeholder="Ejemplo: a=2;b=3;c=a*b"></textarea>
            <button id="evaluateButton"><i class="fas fa-calculator"></i> Evaluar</button>
            <button id="showTokensButton"><i class="fas fa-list"></i> Ver Tokens</button>
            <button id="clearStorageButton"><i class="fas fa-trash-alt"></i> Borrar Datos</button>
        </section>
        <section class="output-section">
            <h2>Resultados</h2>
            <div id="result"></div>
        </section>
        <section class="output-section">
            <h2>Tokens</h2>
            <div id="tokens"></div>
        </section>

        <!-- Sección 2: Generación y Mostrar Árbol Sintáctico -->
        <section id="tree-generation-section" class="output-section">
            <h2>Generar y Mostrar Árbol Sintáctico</h2>
            <button id="generateTreeButton">Generar Árbol</button>
            <button id="showTreeButton">Mostrar Árbol</button>
            <div id="syntax-tree"></div>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 Lenguajes y compiladores</p>
    </footer>
</body>
</html>
