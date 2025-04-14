class NiroClient{
    baseUrl;
    constructor(baseUrl:string){
        this.baseUrl=baseUrl;
    }
    async get(url:string){
        const res=await fetch(this.baseUrl+url);
        const data=await res.json();
        return {
            data,
            status:res.status,
            ok:res.ok
        }
    }
}

export const nixios=new NiroClient("http://localhost:3000/");