import { render } from '@my-react/core/render';
import { useState } from '../../src/runtime/useState';
import App from './App';

const root = document.getElementById('root');
if (root) render(<TestApp />, root);

function TestApp() {
	const [count, setCount] = useState(0);
	const [open, setOpen] = useState(false);

	const handle = () => setCount((prev) => prev + 1);
	const handleModal = () => setOpen((prev) => !prev);

	return (
		<div>
			<span>{count}</span>
			<button onclick={handle}>버튼</button>
			<button onclick={handleModal}>모달토글버튼</button>
			<InnerCounter />
			{open && <Modal count={count} />}
		</div>
	);
}

function InnerCounter() {
	const [count, setCount] = useState(0);
	const handle = () => setCount((prev) => prev + 1);

	return (
		<div>
			<span>{count}</span>
			<button onclick={handle}>내부버튼</button>
		</div>
	);
}

function Modal({ count }) {
	return <div>{`모달 - 현재 카운트: ${count}`}</div>;
}
