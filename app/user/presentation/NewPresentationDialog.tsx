"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createPresentation } from "@/app/user/presentation/actions";

type NewPresentationDialogProps = {
	triggerLabel?: string;
};

export default function NewPresentationDialog({
	triggerLabel = "Create New",
}: NewPresentationDialogProps) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [pending, startTransition] = useTransition();
	const router = useRouter();

	const handleCreate = () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		startTransition(async () => {
			const result = await createPresentation(trimmed);
			if (result.ok) {
				setOpen(false);
				setTitle("");
				router.push(`/user/presentation/${result.id}`);
			}
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) setTitle("");
			}}
		>
			<DialogTrigger asChild>
                
				<Button>{triggerLabel}</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Presentation Name</DialogTitle>
					<DialogDescription>
						Enter a name for your presentation. You can change this later.
					</DialogDescription>
				</DialogHeader>
				<Input
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					placeholder="My presentation"
					autoFocus
					onKeyDown={(event) => {
						if (event.key === "Enter" && title.trim() && !pending) handleCreate();
					}}
				/>
				<DialogFooter>
					<Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={!title.trim() || pending}>
						{pending ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
