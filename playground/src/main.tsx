import { render } from '@my-react/core/render';
import { useState } from '../../src/runtime/useState';
import App from './App';

const root = document.getElementById('root');
if (root) render(<TestApp />, root);

function TestApp() {
	const [count, setCount] = useState(0);
	const handle = () => setCount((prev) => prev + 1);
	return (
		<div>
			<span>{count}</span>
			<button onclick={handle}>버튼</button>
		</div>
	);
}
