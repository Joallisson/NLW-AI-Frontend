import React, { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

export function VideoInputForm() {

    const [videoFile, setVideoFile] = useState<File | null>(null);

    const promptInputRef = useRef<HTMLTextAreaElement>(null)

    function handleFileSelect(event: ChangeEvent<HTMLInputElement>){
        const {files} = event.currentTarget

        if (!files) {
            return
        }

        const selectedFile = files[0]
        setVideoFile(selectedFile)
    }

    async function convertVideoToAudio(video: File){
        console.log('Convert started')

        const ffmpeg = await getFFmpeg()

        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

        // ffmpeg.on('log', log => {
        //     console.log(log)
        // })

        ffmpeg.on("progress", process => {
            console.log('Convert progress: ' + Math.round(process.progress * 100));
            
        })

        await ffmpeg.exec([
            '-i',
            'input.mp4',
            '-map',
            '0:a',
            '-b:a',
            '20k',
            '-acodec',
            'libmp3lame',
            'output.mp3'
        ])

        const data = await ffmpeg.readFile('output.mp3')

        const audioFileBob = new Blob([data], {type: 'audio/mpeg'})
        const audioFile = new File([audioFileBob], 'audio.mp3', {
            type: 'audio/mpeg'
        })

        console.log('Convert finished.')

        return audioFile

    }

    const previewUrl = useMemo(() => {
        if(!videoFile){
            return null
        }

        return URL.createObjectURL(videoFile)
    }, [videoFile])

    async function handleUploadVideo(event: FormEvent<HTMLFormElement>){
        event.preventDefault()

        const prompt = promptInputRef.current?.value

        if(!videoFile){
            return
        }

        const audioFile = await convertVideoToAudio(videoFile)

        const data = new FormData()

        data.append('file', audioFile)

        const response = await api.post('/videos', data)

        console.log(response.data);
    }

    return (
        <form onSubmit={handleUploadVideo} className="space-y-6">
            <label
                htmlFor="video"
                className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
            >
                { videoFile
                ? <video 
                    src={previewUrl!} 
                    controls={false} 
                    className="pointer-events-none absolute inset-0" 
                >

                </video>
                : <>
                    <FileVideo className="w-4 h-4" />
                    Selecione um vídeo
                  </>
                }
            </label>

            <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelect} />

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
                <Textarea
                    ref={promptInputRef}
                    id="transcription_prompt"
                    className="h-20 leading-relaxed resize-none"
                    placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
                />
            </div>

            <Button type="submit" className="w-full">
                Carregar vídeo
                <Upload className="w-4 h-4 ml-2" />
            </Button>

        </form>
    )
}