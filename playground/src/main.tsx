import { render } from '@my-react/core/render';
import { useState } from '../../src/runtime/useState';
import App from './App';

const root = document.getElementById('root');
if (root) render(<TestApp />, root);

function TestApp() {
	const [count, setCount] = useState(0);
	return (
		<div>
			<span>{count}</span>
			<button onclick={(prev) => setCount(prev + 1)}>버튼</button>
		</div>
	);
}
