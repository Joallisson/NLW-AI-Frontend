import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "@/lib/axios";

interface Prompt {
    id: string,
    title: string,
    template: string
}

interface PromptSelectedProps{
    onPromptSelected: (template: string) => void
}

export function PromptSelect(props: PromptSelectedProps) {

    const {onPromptSelected} = props

    const [prompts, setPrompts] = useState<Prompt[] | null>(null)

    function handlePromptSelect(promptId: string){
        const selectedPrompt = prompts?.find(prompt => prompt.id === promptId)

        if(!selectedPrompt){
            return
        }

        onPromptSelected(selectedPrompt.template)
    }

    useEffect(() => {
        api.get('/prompts').then(response => {
            setPrompts(response.data)
        })
    },[])

    return (
        <Select onValueChange={handlePromptSelect}>
            <SelectTrigger>
                <SelectValue placeholder="Selecione um prompt..." />
            </SelectTrigger>
            <SelectContent>
                {prompts?.map(prompt => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.title}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )

}