<script lang="ts">
import * as Card from '$lib/components/ui/card';
</script>
<section class="w-full self-center">
    <Card.Root class="p-[60px] m-[0_auto] w-fit">
        <Card.Content>
            <div>
                <i class="checkmark">✓</i>
            </div>
            <h1>Success</h1> 
            <p>We received your request;<br/> we'll be in touch shortly!</p>
        </Card.Content>
    </Card.Root>
</section>
<style>
    section {
        text-align: center;
        padding: 40px 0;
    }
    h1 {
        color: #88B04B;
        font-weight: 900;
        font-size: 40px;
        margin-bottom: 10px;
    }
    p {
        color: #404F5E;
        font-size:20px;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: #99abbe
        }
    }
    div {
        border-radius: 200px;
        height: 200px;
        width: 200px;
        background: #F8FAF5;
        margin: 0 auto;

        @media (prefers-color-scheme: dark) {
            background: #bce283;
        }
    }
    i {
        color: #9ABC66;
        font-size: 100px;
        line-height: 200px;
        margin-left:-15px;

        @media (prefers-color-scheme: dark) {
            color: #d9f7ac;
        }
    }
</style>