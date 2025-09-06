import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface FormProps {
  onSubmit: (data: { title: string; description: string }) => void;
}

const Etusivu: React.FC<FormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description });
    setTitle('');
    setDescription('');
  };

  return (
    <Card className="max-w-md mx-auto p-6 shadow-lg rounded-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Enter Details</h2>
          <Input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3"
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3"
          />
          <Button type="submit" className="mt-2">Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Etusivu;