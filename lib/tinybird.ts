export async function record(event: string, data: any) {
    console.log('event:', event)
    console.log('data:', data)
    try {
        const res = await fetch(
            `https://api.tinybird.co/v0/events?name=${event}`,
            {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}` }
            }
        ).then(res => res.json())
        return res
    } catch (error) {
        console.error('tinybird error:', error)
    }
    return null;
}