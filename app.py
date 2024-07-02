from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pydot
import base64
import os

def crear_app():
    app = Flask(__name__)
    CORS(app)
    
    class Scanner:
        def __init__(self, input_string):
            self.tokens = input_string.replace(' ', '')
            self.position = 0
            self.current_token = self.tokens[self.position] if self.tokens else None

        def advance(self):
            self.position += 1
            if self.position < len(self.tokens):
                self.current_token = self.tokens[self.position]
            else:
                self.current_token = None

        def get_tokens(self):
            tokens = []
            while self.current_token is not None:
                if self.current_token.isdigit():
                    tokens.append(('NUM', self.current_token))
                elif self.current_token isalpha():
                    tokens.append(('ID', self.current_token))
                elif self.current_token in '+-*/()':
                    tokens.append(('SYM', self.current_token))
                self.advance()
            return tokens

    class Parser:
        def __init__(self, tokens):
            self.tokens = tokens
            self.position = 0
            self.current_token = self.tokens[self.position] if self.tokens else None
            self.graph = pydot.Dot(graph_type='digraph')

        def advance(self):
            self.position += 1
            if self.position < len(self.tokens):
                self.current_token = self.tokens[self.position]
            else:
                self.current_token = None

        def expect(self, expected_type, expected_value=None):
            if (self.current_token and self.current_token[0] == expected_type
                    and (expected_value is None or self.current_token[1] == expected_value)):
                self.advance()
            else:
                raise Exception(f"Syntax error: expected {expected_type} {expected_value} but got {self.current_token}")

        def parse_expr(self, parent=None):
            expr_node = f'expr{self.position}'
            self.graph.add_node(pydot.Node(expr_node, label='expr'))
            if parent:
                self.graph.add_edge(pydot.Edge(parent, expr_node))

            term_node = self.parse_term(expr_node)
            self.parse_z(expr_node)

            return expr_node

        def parse_z(self, parent=None):
            if self.current_token and self.current_token[1] in ['+', '-']:
                op_node = f'op{self.position}'
                self.graph.add_node(pydot.Node(op_node, label=self.current_token[1]))
                self.graph.add_edge(pydot.Edge(parent, op_node))
                self.advance()

                expr_node = self.parse_expr(parent)
            return parent

        def parse_term(self, parent=None):
            term_node = f'term{self.position}'
            self.graph.add_node(pydot.Node(term_node, label='term'))
            if parent:
                self.graph.add_edge(pydot.Edge(parent, term_node))

            factor_node = self.parse_factor(term_node)
            self.parse_x(term_node)

            return term_node

        def parse_x(self, parent=None):
            if self.current_token and self.current_token[1] in ['*', '/']:
                op_node = f'op{self.position}'
                self.graph.add_node(pydot.Node(op_node, label=self.current_token[1]))
                self.graph.add_edge(pydot.Edge(parent, op_node))
                self.advance()

                term_node = self.parse_term(parent)
            return parent

        def parse_factor(self, parent=None):
            factor_node = f'factor{self.position}'
            self.graph.add_node(pydot.Node(factor_node, label='factor'))
            if parent:
                self.graph.add_edge(pydot.Edge(parent, factor_node))

            if self.current_token and self.current_token[1] == '(':
                paren_open_node = f'paren_open{self.position}'
                self.graph.add_node(pydot.Node(paren_open_node, label='('))
                self.graph.add_edge(pydot.Edge(factor_node, paren_open_node))
                self.advance()

                expr_node = self.parse_expr(factor_node)

                self.expect('SYM', ')')
                paren_close_node = f'paren_close{self.position}'
                self.graph.add_node(pydot.Node(paren_close_node, label=')'))
                self.graph.add_edge(pydot.Edge(factor_node, paren_close_node))
            elif self.current_token and self.current_token[0] == 'NUM':
                num_node = f'num{self.position}'
                self.graph.add_node(pydot.Node(num_node, label=self.current_token[1]))
                self.graph.add_edge(pydot.Edge(factor_node, num_node))
                self.advance()
            else:
                raise Exception("Syntax error: expected '(', number or identifier")

            return factor_node

        def draw_syntax_tree(self, expression):
            print(f"Generating syntax tree for expression: {expression}")
            scanner = Scanner(expression)
            self.tokens = scanner.get_tokens()
            self.position = 0
            self.current_token = self.tokens[self.position] if self.tokens else None
            self.parse_expr()
            if not os.path.exists('static'):
                os.makedirs('static')
            file_path = 'static/syntax_tree.png'
            try:
                self.graph.write_png(file_path)
                with open(file_path, "rb") as image_file:
                    base64_image = base64.b64encode(image_file.read()).decode('utf-8')
                print(f"File {file_path} created successfully.")
                return base64_image
            except Exception as e:
                print(f"Error generating image: {e}")
                return None

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/generate-syntax-tree', methods=['POST'])
    def generate_syntax_tree():
        data = request.json
        expression = data['expression']
        print(f"Received expression from client: {expression}")
        parser = Parser([])
        base64_image = parser.draw_syntax_tree(expression)
        if base64_image:
            return jsonify({"success": True, "image": base64_image})
        else:
            return jsonify({"success": False})

    return app

if __name__ == '__main__':
    app = crear_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
